use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ConversationRow {
    pub id: String,
    pub job_address: String,
    pub client_address: String,
    pub freelancer_address: String,
    pub deletion_eligible: bool,
    pub deleted_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MessageRow {
    pub id: String,
    pub conversation_id: String,
    pub sender_address: String,
    pub content: String,
    pub sent_at: String,
}

pub async fn init_db(database_url: &str) -> Result<Pool<Sqlite>, sqlx::Error> {
    let pool = SqlitePoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;

    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY NOT NULL,
            job_address TEXT UNIQUE NOT NULL,
            client_address TEXT NOT NULL,
            freelancer_address TEXT NOT NULL,
            deletion_eligible BOOLEAN NOT NULL DEFAULT 0,
            deleted_at TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY NOT NULL,
            conversation_id TEXT NOT NULL,
            sender_address TEXT NOT NULL,
            content TEXT NOT NULL,
            sent_at TEXT NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );
        "#,
    )
    .execute(&pool)
    .await?;

    Ok(pool)
}

pub async fn get_or_create_conversation(
    pool: &Pool<Sqlite>,
    job_address: &str,
    client_address: &str,
    freelancer_address: &str,
) -> Result<ConversationRow, sqlx::Error> {
    let existing = sqlx::query_as::<_, ConversationRow>(
        "SELECT id, job_address, client_address, freelancer_address, deletion_eligible, deleted_at, created_at FROM conversations WHERE job_address = ?"
    )
    .bind(job_address)
    .fetch_optional(pool)
    .await?;

    if let Some(conv) = existing {
        return Ok(conv);
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO conversations (id, job_address, client_address, freelancer_address, deletion_eligible, created_at) VALUES (?, ?, ?, ?, 0, ?)"
    )
    .bind(&id)
    .bind(job_address)
    .bind(client_address)
    .bind(freelancer_address)
    .bind(&now)
    .execute(pool)
    .await?;

    Ok(ConversationRow {
        id,
        job_address: job_address.to_string(),
        client_address: client_address.to_string(),
        freelancer_address: freelancer_address.to_string(),
        deletion_eligible: false,
        deleted_at: None,
        created_at: now,
    })
}

pub async fn set_deletion_eligible(pool: &Pool<Sqlite>, job_address: &str) -> Result<bool, sqlx::Error> {
    let res = sqlx::query(
        "UPDATE conversations SET deletion_eligible = 1 WHERE job_address = ?"
    )
    .bind(job_address)
    .execute(pool)
    .await?;

    Ok(res.rows_affected() > 0)
}

pub async fn delete_conversation(pool: &Pool<Sqlite>, job_address: &str) -> Result<bool, sqlx::Error> {
    let conv = sqlx::query_as::<_, ConversationRow>(
        "SELECT id, job_address, client_address, freelancer_address, deletion_eligible, deleted_at, created_at FROM conversations WHERE job_address = ?"
    )
    .bind(job_address)
    .fetch_optional(pool)
    .await?;

    if let Some(c) = conv {
        if !c.deletion_eligible {
            return Ok(false);
        }

        // Purge messages
        sqlx::query("DELETE FROM messages WHERE conversation_id = ?")
            .bind(&c.id)
            .execute(pool)
            .await?;

        // Mark deleted_at
        let now = chrono::Utc::now().to_rfc3339();
        sqlx::query("UPDATE conversations SET deleted_at = ? WHERE id = ?")
            .bind(&now)
            .bind(&c.id)
            .execute(pool)
            .await?;

        return Ok(true);
    }

    Ok(false)
}

pub async fn save_message(
    pool: &Pool<Sqlite>,
    conversation_id: &str,
    sender_address: &str,
    encrypted_content: &str,
) -> Result<MessageRow, sqlx::Error> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    sqlx::query(
        "INSERT INTO messages (id, conversation_id, sender_address, content, sent_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(conversation_id)
    .bind(sender_address)
    .bind(encrypted_content)
    .bind(&now)
    .execute(pool)
    .await?;

    Ok(MessageRow {
        id,
        conversation_id: conversation_id.to_string(),
        sender_address: sender_address.to_string(),
        content: encrypted_content.to_string(),
        sent_at: now,
    })
}

pub async fn fetch_messages(
    pool: &Pool<Sqlite>,
    conversation_id: &str,
) -> Result<Vec<MessageRow>, sqlx::Error> {
    sqlx::query_as::<_, MessageRow>(
        "SELECT id, conversation_id, sender_address, content, sent_at FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC"
    )
    .bind(conversation_id)
    .fetch_all(pool)
    .await
}
