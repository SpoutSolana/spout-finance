use anchor_lang::prelude::*;
use std::str::FromStr;

// SAS Program ID (using the real SAS program ID)
pub const SAS_PROGRAM_ID: &str = "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG";

// PDA helpers for SAS
pub fn derive_attestation_pda(credential: &Pubkey, schema: &Pubkey, nonce: &Pubkey) -> (Pubkey, u8) {
    // Match sas-lib deriveAttestationPda: ["attestation", credential, schema, nonce]
    Pubkey::find_program_address(
        &[b"attestation", credential.as_ref(), schema.as_ref(), nonce.as_ref()],
        &Pubkey::from_str(SAS_PROGRAM_ID).unwrap(),
    )
}
