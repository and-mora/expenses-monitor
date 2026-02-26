use crate::auth::AuthenticatedUser;
use actix_web::{web, HttpResponse, Responder};

pub async fn get_sub(user: AuthenticatedUser) -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({"sub": user.sub}))
}

pub fn init(cfg: &mut web::ServiceConfig) {
    cfg.route("/api/debug/sub", web::get().to(get_sub));
}
