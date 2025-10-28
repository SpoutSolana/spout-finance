use anchor_lang::prelude::*;
use std::str::FromStr;

// SAS Program ID (using the real SAS program ID)
pub const SAS_PROGRAM_ID: &str = "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG";

// SAS Account structures (simplified for now)
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct SasAttestation {
    pub credential: Pubkey,
    pub schema: Pubkey,
    pub nonce: Pubkey,
    pub data: Vec<u8>,
    pub expiry: i64,
}

impl SasAttestation {
    pub fn try_from_slice(data: &[u8]) -> Result<Self> {
        // Based on our analysis, the credential starts at offset 33
        if data.len() < 33 + 32 + 32 + 32 + 8 + 1 {
            return Err(anchor_lang::error::ErrorCode::AccountDidNotDeserialize.into());
        }
        
        let mut offset = 33; // Start after the SAS discriminator and some other data
        
        // Parse credential (32 bytes starting at offset 33)
        let credential = Pubkey::new_from_array([
            data[offset], data[offset + 1], data[offset + 2], data[offset + 3], data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7],
            data[offset + 8], data[offset + 9], data[offset + 10], data[offset + 11], data[offset + 12], data[offset + 13], data[offset + 14], data[offset + 15],
            data[offset + 16], data[offset + 17], data[offset + 18], data[offset + 19], data[offset + 20], data[offset + 21], data[offset + 22], data[offset + 23],
            data[offset + 24], data[offset + 25], data[offset + 26], data[offset + 27], data[offset + 28], data[offset + 29], data[offset + 30], data[offset + 31],
        ]);
        offset += 32;
        
        // Parse schema (32 bytes)
        let schema = Pubkey::new_from_array([
            data[offset], data[offset + 1], data[offset + 2], data[offset + 3], data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7],
            data[offset + 8], data[offset + 9], data[offset + 10], data[offset + 11], data[offset + 12], data[offset + 13], data[offset + 14], data[offset + 15],
            data[offset + 16], data[offset + 17], data[offset + 18], data[offset + 19], data[offset + 20], data[offset + 21], data[offset + 22], data[offset + 23],
            data[offset + 24], data[offset + 25], data[offset + 26], data[offset + 27], data[offset + 28], data[offset + 29], data[offset + 30], data[offset + 31],
        ]);
        offset += 32;
        
        // Parse nonce (32 bytes)
        let nonce = Pubkey::new_from_array([
            data[offset], data[offset + 1], data[offset + 2], data[offset + 3], data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7],
            data[offset + 8], data[offset + 9], data[offset + 10], data[offset + 11], data[offset + 12], data[offset + 13], data[offset + 14], data[offset + 15],
            data[offset + 16], data[offset + 17], data[offset + 18], data[offset + 19], data[offset + 20], data[offset + 21], data[offset + 22], data[offset + 23],
            data[offset + 24], data[offset + 25], data[offset + 26], data[offset + 27], data[offset + 28], data[offset + 29], data[offset + 30], data[offset + 31],
        ]);
        offset += 32;
        
        // Parse expiry (8 bytes)
        let expiry = i64::from_le_bytes([
            data[offset], data[offset + 1], data[offset + 2], data[offset + 3], data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7],
        ]);
        offset += 8;
        
        // The remaining bytes are the data field
        let data_vec = data[offset..].to_vec();

        Ok(SasAttestation {
            credential,
            schema,
            nonce,
            data: data_vec,
            expiry,
        })
    }
}
