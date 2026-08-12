#[path = "../src/crypto.rs"]
mod crypto;
#[path = "../src/db.rs"]
mod db;
#[path = "../src/listener.rs"]
mod listener;

#[tokio::test]
async fn test_aes_gcm_encryption_roundtrip() {
    let key_hex = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";
    let message = "Hello PolyLance Escrow! Confidential dispute evidence.";

    let encrypted = crypto::encrypt_message(message, key_hex).unwrap();
    assert_ne!(message, encrypted);

    let decrypted = crypto::decrypt_message(&encrypted, key_hex).unwrap();
    assert_eq!(message, decrypted);
}

#[tokio::test]
async fn test_database_persistence_and_deletion_threshold() {
    let db_url = "sqlite::memory:";
    let pool = db::init_db(db_url).await.unwrap();

    let job_address = "0x1111222233334444555566667777888899990000";
    let client = "0xaaaa1111aaaa1111aaaa1111aaaa1111aaaa1111";
    let freelancer = "0xbbbb2222bbbb2222bbbb2222bbbb2222bbbb2222";
    let key_hex = "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f";

    // 1. Create conversation
    let conv = db::get_or_create_conversation(&pool, job_address, client, freelancer)
        .await
        .unwrap();
    assert_eq!(conv.deletion_eligible, false);

    // 2. Save encrypted message
    let encrypted = crypto::encrypt_message("Initial specification text", key_hex).unwrap();
    let msg = db::save_message(&pool, &conv.id, client, &encrypted)
        .await
        .unwrap();
    assert_eq!(msg.sender_address, client);

    // 3. Attempt deletion BEFORE payment — must be blocked (return false)
    let pre_payment_delete = db::delete_conversation(&pool, job_address).await.unwrap();
    assert_eq!(pre_payment_delete, false);

    // Messages must still exist
    let msgs_before = db::fetch_messages(&pool, &conv.id).await.unwrap();
    assert_eq!(msgs_before.len(), 1);

    // 4. Trigger payment unlock (simulating PaymentReleased / AutoReleased event)
    let unlocked = db::set_deletion_eligible(&pool, job_address).await.unwrap();
    assert_eq!(unlocked, true);

    // 5. Attempt deletion AFTER payment — must succeed (return true)
    let post_payment_delete = db::delete_conversation(&pool, job_address).await.unwrap();
    assert_eq!(post_payment_delete, true);

    // Messages must now be purged from DB
    let msgs_after = db::fetch_messages(&pool, &conv.id).await.unwrap();
    assert_eq!(msgs_after.len(), 0);
}
