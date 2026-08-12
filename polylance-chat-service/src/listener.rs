use crate::db;
use sqlx::{Pool, Sqlite};
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::{error, info};

pub fn start_payment_listener(
    _rpc_url: String,
    _factory_address: String,
    pool: Pool<Sqlite>,
    tx_events: broadcast::Sender<(String, String)>,
) {
    tokio::spawn(async move {
        info!("Started PolyLance Payment Event Listener Tokio Task");

        // Polling / WebSocket event listener loop
        let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(5));
        loop {
            interval.tick().await;

            // In production, ethers-rs Provider / Contract filters listen to:
            // - PaymentReleased(uint256 toFreelancer, uint256 fee)
            // - AutoReleased()
            // - DisputeResolved(uint256 toFreelancer, uint256 toClient, uint256 fee)
            // When fired, sets deletion_eligible = true and broadcasts socket notice.
        }
    });
}

pub async fn trigger_payment_unlock(
    pool: &Pool<Sqlite>,
    job_address: &str,
    tx_events: &broadcast::Sender<(String, String)>,
) -> Result<bool, String> {
    match db::set_deletion_eligible(pool, job_address).await {
        Ok(updated) => {
            if updated {
                let _ = tx_events.send((job_address.to_string(), "deletion-unlocked".to_string()));
                info!("Payment confirmed on-chain: Deletion unlocked for {}", job_address);
            }
            Ok(updated)
        }
        Err(e) => Err(format!("Database error: {}", e)),
    }
}
