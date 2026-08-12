use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use ethers::types::{Address, Signature};
use rand::RngCore;
use std::str::FromStr;

pub fn encrypt_message(plaintext: &str, key_hex: &str) -> Result<String, String> {
    let key_bytes = hex::decode(key_hex).map_err(|e| format!("Invalid hex key: {}", e))?;
    if key_bytes.len() != 32 {
        return Err("Encryption key must be 32 bytes".into());
    }

    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|e| format!("Cipher init error: {}", e))?;

    let mut iv = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut iv);
    let nonce = Nonce::from_slice(&iv);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encryption error: {}", e))?;

    // Prepend IV (12 bytes) to ciphertext
    let mut combined = Vec::with_capacity(12 + ciphertext.len());
    combined.extend_from_slice(&iv);
    combined.extend_from_slice(&ciphertext);

    Ok(BASE64.encode(combined))
}

pub fn decrypt_message(stored_b64: &str, key_hex: &str) -> Result<String, String> {
    let key_bytes = hex::decode(key_hex).map_err(|e| format!("Invalid hex key: {}", e))?;
    if key_bytes.len() != 32 {
        return Err("Encryption key must be 32 bytes".into());
    }

    let combined = BASE64
        .decode(stored_b64)
        .map_err(|e| format!("Invalid Base64 payload: {}", e))?;
    if combined.len() < 12 {
        return Err("Ciphertext payload too short".into());
    }

    let (iv, ciphertext) = combined.split_at(12);
    let cipher = Aes256Gcm::new_from_slice(&key_bytes)
        .map_err(|e| format!("Cipher init error: {}", e))?;
    let nonce = Nonce::from_slice(iv);

    let plaintext_bytes = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Decryption error: {}", e))?;

    String::from_utf8(plaintext_bytes).map_err(|e| format!("Invalid UTF-8 plaintext: {}", e))
}

pub fn verify_wallet_signature(address_hex: &str, signature_hex: &str, message: &str) -> bool {
    let expected_addr = match Address::from_str(address_hex) {
        Ok(addr) => addr,
        Err(_) => return false,
    };

    let sig = match Signature::from_str(signature_hex) {
        Ok(s) => s,
        Err(_) => return false,
    };

    match sig.verify(message, expected_addr) {
        Ok(_) => true,
        Err(_) => false,
    }
}
