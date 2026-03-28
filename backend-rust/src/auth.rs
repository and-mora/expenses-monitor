use actix_web::{
    dev::Payload,
    error::{ErrorServiceUnavailable, ErrorUnauthorized},
    web, FromRequest, HttpRequest,
};
use jsonwebtoken::{decode_header, jwk::JwkSet, Algorithm, DecodingKey, Validation};
use reqwest::{Client, Url};
use serde::Deserialize;
use std::{collections::HashMap, future::Future, pin::Pin, sync::RwLock, time::Duration};

use crate::configuration::AuthenticationSettings;

const OPENID_CONFIGURATION_PATH: &str = "/.well-known/openid-configuration";

#[derive(Debug, Clone, Deserialize)]
pub struct AuthenticatedUser {
    pub sub: String,
}

#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
struct Claims {
    pub sub: String,
    pub exp: usize,
    #[serde(default)]
    pub aud: Option<AudienceClaim>,
    #[serde(default)]
    pub azp: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
enum AudienceClaim {
    One(String),
    Many(Vec<String>),
}

impl AudienceClaim {
    fn contains(&self, expected: &str) -> bool {
        match self {
            Self::One(audience) => audience == expected,
            Self::Many(audiences) => audiences.iter().any(|audience| audience == expected),
        }
    }
}

impl Claims {
    fn matches_expected_client(&self, expected_client: &str) -> bool {
        self.aud
            .as_ref()
            .is_some_and(|audience| audience.contains(expected_client))
            || self.azp.as_deref() == Some(expected_client)
    }
}

#[derive(Debug, Deserialize)]
struct OpenIdConfiguration {
    issuer: String,
    jwks_uri: String,
}

#[derive(Debug)]
pub enum AuthenticationError {
    InvalidToken(String),
    ServiceUnavailable(String),
}

pub struct AuthenticationService {
    client: Client,
    settings: AuthenticationSettings,
    jwks_uri: RwLock<Option<Url>>,
    decoding_keys: RwLock<HashMap<String, DecodingKey>>,
}

impl AuthenticationService {
    pub fn build(settings: AuthenticationSettings) -> Result<Self, String> {
        let client = Client::builder()
            .timeout(Duration::from_secs(5))
            .build()
            .map_err(|error| format!("Failed to build authentication HTTP client: {error}"))?;

        Ok(Self {
            client,
            settings,
            jwks_uri: RwLock::new(None),
            decoding_keys: RwLock::new(HashMap::new()),
        })
    }

    pub async fn validate_token(
        &self,
        token: &str,
    ) -> Result<AuthenticatedUser, AuthenticationError> {
        let header = decode_header(token).map_err(|error| {
            AuthenticationError::InvalidToken(format!("Failed to decode JWT header: {error}"))
        })?;
        let kid = header.kid.ok_or_else(|| {
            AuthenticationError::InvalidToken("JWT header is missing kid".to_string())
        })?;

        if !self.has_decoding_key(&kid)? {
            self.refresh_decoding_keys().await?;
        }

        let decoding_keys = self.decoding_keys.read().map_err(|_| {
            AuthenticationError::ServiceUnavailable(
                "Authentication key cache is unavailable".to_string(),
            )
        })?;
        let decoding_key = decoding_keys.get(&kid).ok_or_else(|| {
            AuthenticationError::InvalidToken(format!("No signing key found for kid `{kid}`"))
        })?;

        let mut validation = Validation::new(Algorithm::RS256);
        let issuer = [self.settings.jwt_issuer.as_str()];
        validation.set_issuer(&issuer);
        validation.leeway = self.settings.jwt_clock_skew_seconds;
        validation.validate_nbf = true;
        validation.validate_aud = false;

        let token_data =
            jsonwebtoken::decode::<Claims>(token, decoding_key, &validation).map_err(|error| {
                AuthenticationError::InvalidToken(format!("JWT validation failed: {error}"))
            })?;

        if !token_data
            .claims
            .matches_expected_client(&self.settings.jwt_audience)
        {
            return Err(AuthenticationError::InvalidToken(format!(
                "JWT recipient does not match expected client `{}`",
                self.settings.jwt_audience
            )));
        }

        let sub = token_data.claims.sub;
        if sub.trim().is_empty() {
            return Err(AuthenticationError::InvalidToken(
                "JWT subject claim is missing".to_string(),
            ));
        }

        Ok(AuthenticatedUser { sub })
    }

    fn has_decoding_key(&self, kid: &str) -> Result<bool, AuthenticationError> {
        let decoding_keys = self.decoding_keys.read().map_err(|_| {
            AuthenticationError::ServiceUnavailable(
                "Authentication key cache is unavailable".to_string(),
            )
        })?;
        Ok(decoding_keys.contains_key(kid))
    }

    async fn refresh_decoding_keys(&self) -> Result<(), AuthenticationError> {
        let jwks_uri = self.get_or_discover_jwks_uri().await?;
        let jwk_set = self
            .client
            .get(jwks_uri.clone())
            .send()
            .await
            .map_err(|error| {
                AuthenticationError::ServiceUnavailable(format!(
                    "Failed to fetch JWKS from {jwks_uri}: {error}"
                ))
            })?
            .error_for_status()
            .map_err(|error| {
                AuthenticationError::ServiceUnavailable(format!(
                    "Failed to fetch JWKS from {jwks_uri}: {error}"
                ))
            })?
            .json::<JwkSet>()
            .await
            .map_err(|error| {
                AuthenticationError::ServiceUnavailable(format!(
                    "Failed to decode JWKS from {jwks_uri}: {error}"
                ))
            })?;

        let mut decoding_keys = HashMap::new();
        for jwk in jwk_set.keys {
            let Some(kid) = jwk.common.key_id.clone() else {
                tracing::warn!("Skipping JWK without kid");
                continue;
            };

            match DecodingKey::from_jwk(&jwk) {
                Ok(key) => {
                    decoding_keys.insert(kid, key);
                }
                Err(error) => {
                    tracing::warn!("Skipping unsupported JWK `{kid}`: {error}");
                }
            }
        }

        if decoding_keys.is_empty() {
            return Err(AuthenticationError::ServiceUnavailable(format!(
                "No usable signing keys returned by {jwks_uri}"
            )));
        }

        let key_count = decoding_keys.len();
        let mut cache = self.decoding_keys.write().map_err(|_| {
            AuthenticationError::ServiceUnavailable(
                "Authentication key cache is unavailable".to_string(),
            )
        })?;
        *cache = decoding_keys;
        tracing::info!("Loaded {key_count} JWKS signing key(s)");
        Ok(())
    }

    async fn get_or_discover_jwks_uri(&self) -> Result<Url, AuthenticationError> {
        let cached_jwks_uri = {
            self.jwks_uri
                .read()
                .map_err(|_| {
                    AuthenticationError::ServiceUnavailable(
                        "Authentication metadata cache is unavailable".to_string(),
                    )
                })?
                .clone()
        };

        if let Some(jwks_uri) = cached_jwks_uri {
            return Ok(jwks_uri);
        }

        let discovered_jwks_uri = discover_jwks_uri(&self.client, &self.settings).await?;

        let mut jwks_uri = self.jwks_uri.write().map_err(|_| {
            AuthenticationError::ServiceUnavailable(
                "Authentication metadata cache is unavailable".to_string(),
            )
        })?;
        if let Some(cached) = jwks_uri.as_ref() {
            return Ok(cached.clone());
        }

        *jwks_uri = Some(discovered_jwks_uri.clone());
        Ok(discovered_jwks_uri)
    }
}

impl FromRequest for AuthenticatedUser {
    type Error = actix_web::Error;
    type Future = Pin<Box<dyn Future<Output = Result<AuthenticatedUser, actix_web::Error>>>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        let token = req
            .headers()
            .get(actix_web::http::header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.strip_prefix("Bearer "))
            .map(str::to_owned);
        let auth_service = req.app_data::<web::Data<AuthenticationService>>().cloned();

        Box::pin(async move {
            let token = token.ok_or_else(|| ErrorUnauthorized("Missing Authorization header"))?;
            let auth_service = auth_service
                .ok_or_else(|| ErrorServiceUnavailable("Missing authentication configuration"))?;

            auth_service
                .validate_token(&token)
                .await
                .map_err(|error| match error {
                    AuthenticationError::InvalidToken(error) => {
                        tracing::warn!("JWT validation failed: {error}");
                        ErrorUnauthorized("Invalid token")
                    }
                    AuthenticationError::ServiceUnavailable(error) => {
                        tracing::error!("Authentication service unavailable: {error}");
                        ErrorServiceUnavailable("Authentication service unavailable")
                    }
                })
        })
    }
}

async fn discover_jwks_uri(
    client: &Client,
    settings: &AuthenticationSettings,
) -> Result<Url, AuthenticationError> {
    let issuer = settings.jwt_issuer.trim_end_matches('/');
    let discovery_url = format!("{issuer}{OPENID_CONFIGURATION_PATH}");

    let openid_configuration = client
        .get(discovery_url.clone())
        .send()
        .await
        .map_err(|error| {
            AuthenticationError::ServiceUnavailable(format!(
                "Failed to fetch OpenID configuration from {discovery_url}: {error}"
            ))
        })?
        .error_for_status()
        .map_err(|error| {
            AuthenticationError::ServiceUnavailable(format!(
                "Failed to fetch OpenID configuration from {discovery_url}: {error}"
            ))
        })?
        .json::<OpenIdConfiguration>()
        .await
        .map_err(|error| {
            AuthenticationError::ServiceUnavailable(format!(
                "Failed to decode OpenID configuration from {discovery_url}: {error}"
            ))
        })?;

    if openid_configuration.issuer.trim_end_matches('/') != issuer {
        return Err(AuthenticationError::ServiceUnavailable(format!(
            "OpenID issuer mismatch: expected `{issuer}`, got `{}`",
            openid_configuration.issuer
        )));
    }

    Url::parse(&openid_configuration.jwks_uri).map_err(|error| {
        AuthenticationError::ServiceUnavailable(format!(
            "Invalid jwks_uri `{}`: {error}",
            openid_configuration.jwks_uri
        ))
    })
}

#[cfg(test)]
mod tests {
    use super::AuthenticationService;
    use crate::configuration::AuthenticationSettings;

    #[test]
    fn build_does_not_require_keycloak_reachability() {
        let settings = AuthenticationSettings {
            jwt_issuer: "http://127.0.0.1:1/realms/expenses".to_string(),
            jwt_audience: "expenses-monitor".to_string(),
            jwt_clock_skew_seconds: 30,
        };

        let service = AuthenticationService::build(settings);
        assert!(service.is_ok());
    }
}
