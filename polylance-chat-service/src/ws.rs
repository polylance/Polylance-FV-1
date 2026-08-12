use crate::{crypto, db, listener};
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::IntoResponse,
    Json,
};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Sqlite};
use std::sync::Arc;
use tokio::sync::broadcast;
use tracing::{error, info};

#[derive(Clone)]
pub struct AppState {
    pub pool: Pool<Sqlite>,
    pub encryption_key: String,
    pub tx_events: broadcast::Sender<(String, String)>,
}

#[derive(Debug, Deserialize)]
pub struct AuthPayload {
    pub address: String,
    pub signature: String,
    pub message: String,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "action", content = "payload")]
pub enum ClientAction {
    #[serde(rename = "join-job-chat")]
    JoinJobChat {
        job_address: String,
        client_address: String,
        freelancer_address: String,
    },
    #[serde(rename = "send-message")]
    SendMessage {
        job_address: String,
        content: String,
    },
    #[serde(rename = "delete-conversation")]
    DeleteConversation { job_address: String },
}

#[derive(Debug, Serialize, Clone)]
pub struct ChatMessageDto {
    pub id: String,
    pub conversation_id: String,
    pub sender_address: String,
    pub content: String,
    pub sent_at: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "event", content = "payload")]
pub enum ServerNotice {
    #[serde(rename = "joined")]
    Joined {
        conversation_id: String,
        job_address: String,
        deletion_eligible: bool,
        history: Vec<ChatMessageDto>,
    },
    #[serde(rename = "new-message")]
    NewMessage(ChatMessageDto),
    #[serde(rename = "deletion-unlocked")]
    DeletionUnlocked { job_address: String },
    #[serde(rename = "conversation-deleted")]
    ConversationDeleted { job_address: String, by: String },
    #[serde(rename = "error")]
    Error { message: String },
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx_events = state.tx_events.subscribe();

    let mut authenticated_wallet: Option<String> = None;
    let mut active_job_address: Option<String> = None;

    info!("New WebSocket connection established");

    loop {
        tokio::select! {
            // Handle incoming WebSocket messages from client
            msg = receiver.next() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        // Check if auth message first
                        if authenticated_wallet.is_none() {
                            if let Ok(auth) = serde_json::from_str::<AuthPayload>(&text) {
                                if crypto::verify_wallet_signature(&auth.address, &auth.signature, &auth.message) {
                                    authenticated_wallet = Some(auth.address.to_lowercase());
                                    info!("WebSocket wallet authenticated: {:?}", authenticated_wallet);
                                    let ack = serde_json::to_string(&ServerNotice::Error { message: "AUTH_OK".into() }).unwrap();
                                    let _ = sender.send(Message::Text(ack)).await;
                                    continue;
                                } else {
                                    let err = serde_json::to_string(&ServerNotice::Error { message: "Unauthorized wallet signature".into() }).unwrap();
                                    let _ = sender.send(Message::Text(err)).await;
                                    break;
                                }
                            } else {
                                let err = serde_json::to_string(&ServerNotice::Error { message: "Authentication required as first message".into() }).unwrap();
                                let _ = sender.send(Message::Text(err)).await;
                                break;
                            }
                        }

                        let wallet = authenticated_wallet.clone().unwrap();

                        // Process authenticated client actions
                        if let Ok(action) = serde_json::from_str::<ClientAction>(&text) {
                            match action {
                                ClientAction::JoinJobChat { job_address, client_address, freelancer_address } => {
                                    let is_party = wallet == client_address.to_lowercase() || wallet == freelancer_address.to_lowercase();
                                    if !is_party {
                                        let err = serde_json::to_string(&ServerNotice::Error { message: "Not a party to this job".into() }).unwrap();
                                        let _ = sender.send(Message::Text(err)).await;
                                        continue;
                                    }

                                    match db::get_or_create_conversation(&state.pool, &job_address, &client_address, &freelancer_address).await {
                                        Ok(conv) => {
                                            if conv.deletedAt.is_some() {
                                                let err = serde_json::to_string(&ServerNotice::Error { message: "This conversation has been deleted".into() }).unwrap();
                                                let _ = sender.send(Message::Text(err)).await;
                                                continue;
                                            }

                                            active_job_address = Some(job_address.clone());

                                            // Fetch & decrypt history
                                            let raw_msgs = db::fetch_messages(&state.pool, &conv.id).await.unwrap_or_default();
                                            let decrypted_history: Vec<ChatMessageDto> = raw_msgs
                                                .into_iter()
                                                .map(|m| {
                                                    let decrypted = crypto::decrypt_message(&m.content, &state.encryption_key)
                                                        .unwrap_or_else(|_| "[Encrypted Message]".into());
                                                    ChatMessageDto {
                                                        id: m.id,
                                                        conversation_id: m.conversation_id,
                                                        sender_address: m.sender_address,
                                                        content: decrypted,
                                                        sent_at: m.sent_at,
                                                    }
                                                })
                                                .collect();

                                            let joined_notice = ServerNotice::Joined {
                                                conversation_id: conv.id,
                                                job_address: job_address.clone(),
                                                deletion_eligible: conv.deletion_eligible,
                                                history: decrypted_history,
                                            };

                                            let _ = sender.send(Message::Text(serde_json::to_string(&joined_notice).unwrap())).await;
                                        }
                                        Err(e) => {
                                            let err = serde_json::to_string(&ServerNotice::Error { message: format!("Database error: {}", e) }).unwrap();
                                            let _ = sender.send(Message::Text(err)).await;
                                        }
                                    }
                                }

                                ClientAction::SendMessage { job_address, content } => {
                                    match db::get_or_create_conversation(&state.pool, &job_address, &wallet, &wallet).await {
                                        Ok(conv) => {
                                            if conv.deletedAt.is_some() {
                                                let err = serde_json::to_string(&ServerNotice::Error { message: "Conversation unavailable".into() }).unwrap();
                                                let _ = sender.send(Message::Text(err)).await;
                                                continue;
                                            }

                                            match crypto::encrypt_message(&content, &state.encryption_key) {
                                                Ok(encrypted) => {
                                                    match db::save_message(&state.pool, &conv.id, &wallet, &encrypted).await {
                                                        Ok(msg) => {
                                                            let dto = ChatMessageDto {
                                                                id: msg.id,
                                                                conversation_id: msg.conversation_id,
                                                                sender_address: wallet.clone(),
                                                                content: content.clone(),
                                                                sent_at: msg.sent_at,
                                                            };

                                                            let notice = ServerNotice::NewMessage(dto);
                                                            let _ = sender.send(Message::Text(serde_json::to_string(&notice).unwrap())).await;
                                                        }
                                                        Err(e) => {
                                                            let err = serde_json::to_string(&ServerNotice::Error { message: format!("Failed to save message: {}", e) }).unwrap();
                                                            let _ = sender.send(Message::Text(err)).await;
                                                        }
                                                    }
                                                }
                                                Err(e) => {
                                                    let err = serde_json::to_string(&ServerNotice::Error { message: format!("Encryption failure: {}", e) }).unwrap();
                                                    let _ = sender.send(Message::Text(err)).await;
                                                }
                                            }
                                        }
                                        Err(e) => {
                                            let err = serde_json::to_string(&ServerNotice::Error { message: format!("Conversation lookup failed: {}", e) }).unwrap();
                                            let _ = sender.send(Message::Text(err)).await;
                                        }
                                    }
                                }

                                ClientAction::DeleteConversation { job_address } => {
                                    match db::delete_conversation(&state.pool, &job_address).await {
                                        Ok(true) => {
                                            let notice = ServerNotice::ConversationDeleted {
                                                job_address: job_address.clone(),
                                                by: wallet.clone(),
                                            };
                                            let _ = sender.send(Message::Text(serde_json::to_string(&notice).unwrap())).await;
                                        }
                                        Ok(false) => {
                                            let err = serde_json::to_string(&ServerNotice::Error { message: "Cannot delete — payment has not been released yet or not found".into() }).unwrap();
                                            let _ = sender.send(Message::Text(err)).await;
                                        }
                                        Err(e) => {
                                            let err = serde_json::to_string(&ServerNotice::Error { message: format!("Database deletion error: {}", e) }).unwrap();
                                            let _ = sender.send(Message::Text(err)).await;
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    _ => {}
                }
            }

            // Handle background broadcast events (e.g. deletion-unlocked)
            Ok((target_job, event_type)) = rx_events.recv() => {
                if let Some(ref current_job) = active_job_address {
                    if current_job.to_lowercase() == target_job.to_lowercase() {
                        if event_type == "deletion-unlocked" {
                            let notice = ServerNotice::DeletionUnlocked { job_address: target_job };
                            let _ = sender.send(Message::Text(serde_json::to_string(&notice).unwrap())).await;
                        }
                    }
                }
            }
        }
    }
}

#[derive(Deserialize)]
pub struct UnlockRequest {
    pub job_address: String,
}

pub async fn unlock_deletion_endpoint(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<UnlockRequest>,
) -> impl IntoResponse {
    match listener::trigger_payment_unlock(&state.pool, &payload.job_address, &state.tx_events).await {
        Ok(true) => Json(serde_json::json!({ "success": true, "unlocked": true })),
        Ok(false) => Json(serde_json::json!({ "success": false, "reason": "No conversation found" })),
        Err(e) => Json(serde_json::json!({ "success": false, "error": e })),
    }
}
