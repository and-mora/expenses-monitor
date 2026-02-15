mod categories;
mod create;
mod delete;
mod list;
mod models;
mod update;

pub use categories::get_categories;
pub use create::create_payment;
pub use delete::delete_payment;
pub use list::get_recent_payments;
pub use update::update_payment;

use actix_web::web;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/payments")
            .route("/categories", web::get().to(get_categories))
            .route("", web::get().to(get_recent_payments))
            .route("", web::post().to(create_payment))
            .route("/{id}", web::put().to(update_payment))
            .route("/{id}", web::delete().to(delete_payment)),
    );
}
