pub mod create;
pub mod delete;
pub mod list;
pub mod models;
pub mod shared;

use actix_web::web;
use actix_web::web::ServiceConfig;

pub fn configure(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/api/wallets")
            .route("", web::post().to(create::create_wallet))
            .route("", web::get().to(list::list_wallets))
            .route("/{wallet_id}", web::delete().to(delete::delete_wallet)),
    );
}
