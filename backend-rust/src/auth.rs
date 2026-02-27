use actix_web::{dev::Payload, error::ErrorUnauthorized, FromRequest, HttpRequest};
use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine as _;
use chrono::Utc;
use serde::Deserialize;
use std::future::{ready, Ready};

#[derive(Debug, Clone, Deserialize)]
pub struct AuthenticatedUser {
    pub sub: String,
}

#[derive(Debug, Deserialize)]
struct Claims {
    pub sub: String,
    pub exp: Option<i64>,
    pub nbf: Option<i64>,
    pub aud: Option<serde_json::Value>,
    // roles/scope can be added later if needed
}

impl FromRequest for AuthenticatedUser {
    type Error = actix_web::Error;
    type Future = Ready<Result<AuthenticatedUser, actix_web::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        // Expect Authorization: Bearer <token>
        let header = req
            .headers()
            .get(actix_web::http::header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.strip_prefix("Bearer "));

        let token = match header {
            Some(t) => t,
            None => return ready(Err(ErrorUnauthorized("Missing Authorization header"))),
        };

        // Decode JWT payload without signature verification. The gateway must
        // validate the token; here we only parse the payload (base64url).
        let parts: Vec<&str> = token.split('.').collect();
        if parts.len() < 2 {
            return ready(Err(ErrorUnauthorized("Invalid token format")));
        }

        let payload_b64 = parts[1];
        let decoded = match URL_SAFE_NO_PAD.decode(payload_b64) {
            Ok(bytes) => bytes,
            Err(_) => return ready(Err(ErrorUnauthorized("Invalid token payload"))),
        };

        let token_claims: Claims = match serde_json::from_slice(&decoded) {
            Ok(c) => c,
            Err(_) => return ready(Err(ErrorUnauthorized("Invalid token claims"))),
        };

        // Check exp if present
        if let Some(exp) = token_claims.exp {
            if exp < Utc::now().timestamp() {
                return ready(Err(ErrorUnauthorized("Token expired")));
            }
        }

        let sub = token_claims.sub;

        ready(Ok(AuthenticatedUser { sub }))
    }
}
