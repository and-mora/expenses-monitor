use crate::authentication::AuthError;
use crate::telemetry::spawn_blocking_with_tracing;
use actix_web::{web, HttpResponse};
use anyhow::Context;
use secrecy::{ExposeSecret, SecretString};
use std::ops::Deref;

#[derive(serde::Deserialize)]
pub struct Credentials {
    username: String,
    password: SecretString,
}

pub async fn login(credentials: web::Form<Credentials>) -> HttpResponse {
    validate_credentials(credentials.deref())
        .await
}

#[tracing::instrument(name = "Validate credentials", skip(credentials))]
async fn validate_credentials(
    // username: &String,
    // password: SecretString
    credentials: &Credentials,
) -> Result<(), AuthError> {
    let expected_password_hash = SecretString::from(""); // TODO get from config

    spawn_blocking_with_tracing(move || {
        verify_password_hash(expected_password_hash, credentials.password)
    })
    .await
    .context("Failed to spawn blocking task.")
    .map_err(AuthError::UnexpectedError)??;

    // user_id
    //     .ok_or_else(|| anyhow::anyhow!("Unknown username."))
    //     .map_err(AuthError::InvalidCredentials)
}

#[tracing::instrument(
    name = "Verify password hash",
    skip(expected_password_hash, password_candidate)
)]
fn verify_password_hash(
    expected_password_hash: SecretString,
    password_candidate: SecretString,
) -> Result<(), AuthError> {
    // let expected_password_hash = PasswordHash::new(expected_password_hash.expose_secret())
    //     .context("Failed to parse hash in PHC string format.")
    //     .map_err(AuthError::UnexpectedError)?;
    // Argon2::default()
    //     .verify_password(
    //         password_candidate.expose_secret().as_bytes(),
    //         &expected_password_hash,
    //     )
    //     .context("Invalid password.")
    //     .map_err(AuthError::UnexpectedError)
}
