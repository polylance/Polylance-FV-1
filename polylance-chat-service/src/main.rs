mod crypto;
mod db;
mod listener;
mod ws;

use axum::{
    routing::{get, post},
    Router,
};
use dotenvy::dotenv;
use std::{env, net::SocketAddr, sync::Arc};
use tokio::sync::broadcast;
use tower_http::cors::{Any, CorsLayer};
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite://chat.db".into());
    let rpc_url = env::var("RPC_URL").unwrap_or_else(|_| "http://127.0.0.1:8545".into());
    let factory_address = env::var("JOB_FACTORY_ADDRESS").unwrap_or_default();
    let encryption_key = env::var("MESSAGE_ENCRYPTION_KEY").unwrap_or_else(|_| "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f".into());
    let port: u16 = env::var("PORT").unwrap_or_else(|_| "3001".into()).parse().unwrap_or(3001);

    info!("Initializing PolyLance Chat Service SQLite Database...");
    let pool = db::init_db(&database_url).await?;

    let (tx_events, _) = broadcast::channel::<(String, String)>(100);

    // Start background payment listener task
    listener::start_payment_listener(rpc_url, factory_address, pool.clone(), tx_events.clone());

    let app_state = Arc::new(ws::AppState {
        pool,
        encryption_key,
        tx_events,
    });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/ws", get(ws::ws_handler))
        .route("/api/unlock", post(ws::unlock_deletion_endpoint))
        .layer(cors)
        .with_state(app_state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("PolyLance Rust Chat Service listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
