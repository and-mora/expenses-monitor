use crate::routes::health_check;
use actix_web::dev::Server;
use actix_web::middleware::Logger;
use actix_web::{web, App, HttpServer};
use sqlx::PgPool;
use std::net::TcpListener;

pub fn run(listener: TcpListener, connection_pool: PgPool) -> Result<Server, std::io::Error> {
    let connection_pool = web::Data::new(connection_pool);
    let server = HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .route("/healthcheck", web::get().to(health_check))
            .app_data(connection_pool.clone())
    })
    .listen(listener)?
    .run();

    Ok(server)
}