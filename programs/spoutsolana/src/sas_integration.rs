use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_pack::Pack;
use std::str::FromStr;

// SAS Program ID
pub const SAS_PROGRAM_ID: &str = "22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG";

// SAS Account Structures based on actual SAS program
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct SasCredential {
    pub discriminator: u8, // 0
    pub authority: Pubkey,
    pub name: Vec<u8>,
    pub authorized_signers: Vec<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct SasSchema {
    pub discriminator: u8, // 1
    pub credential: Pubkey,
    pub name: Vec<u8>,
    pub description: Vec<u8>,
    pub layout: Vec<u8>,
    pub field_names: Vec<u8>,
    pub is_paused: bool,
    pub version: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct SasAttestation {
    pub discriminator: u8, // 2
    pub nonce: Pubkey,
    pub credential: Pubkey,
    pub schema: Pubkey,
    pub data: Vec<u8>,
    pub signer: Pubkey,
    pub expiry: i64,
    pub token_account: Pubkey,
}

// Helper function to verify KYC status from SAS attestation
pub fn verify_kyc_status(
    attestation_account: &AccountInfo,
    schema_account: &AccountInfo,
    expected_credential: Pubkey,
    expected_schema: Pubkey,
) -> Result<bool> {
    // 1. Check if attestation account exists and has data
    require!(
        !attestation_account.data_is_empty(),
        crate::errors::ErrorCode::AccountNotInitialized
    );

    // 2. Check if schema account exists and has data
    require!(
        !schema_account.data_is_empty(),
        crate::errors::ErrorCode::SchemaMismatch
    );

    // 3. Deserialize attestation account
    let attestation_data = attestation_account.data.borrow();
    let attestation = SasAttestation::try_from_slice(&attestation_data[8..])?; // Skip discriminator
    
    // 4. Deserialize schema account
    let schema_data = schema_account.data.borrow();
    let schema = SasSchema::try_from_slice(&schema_data[8..])?; // Skip discriminator
    
    // 5. Verify the attestation is for the correct credential and schema
    require!(
        attestation.credential == expected_credential,
        crate::errors::ErrorCode::SchemaMismatch
    );
    
    require!(
        attestation.schema == expected_schema,
        crate::errors::ErrorCode::SchemaMismatch
    );
    
    // 6. Check if attestation is expired
    let current_timestamp = Clock::get()?.unix_timestamp;
    require!(
        current_timestamp < attestation.expiry,
        crate::errors::ErrorCode::CredentialExpired
    );
    
    // 7. Verify KYC status from attestation data
    // The data field contains the serialized KYC status
    // Based on our schema, it should be [1, 0] for kycCompleted: 1
    require!(
        attestation.data.len() >= 2,
        crate::errors::ErrorCode::InvalidCredentialData
    );
    
    // Check if kycCompleted is true (1)
    let kyc_completed = attestation.data[0] == 1;
    require!(
        kyc_completed,
        crate::errors::ErrorCode::KycVerificationFailed
    );
    
    Ok(true)
}

// Helper function to derive attestation PDA
pub fn derive_attestation_pda(
    credential: Pubkey,
    schema: Pubkey,
    holder: Pubkey,
    sas_program: Pubkey,
) -> Result<Pubkey> {
    let seeds = &[
        b"attestation",
        credential.as_ref(),
        schema.as_ref(),
        holder.as_ref(),
    ];
    
    let (pda, _bump) = Pubkey::find_program_address(seeds, &sas_program);
    Ok(pda)
}

// Helper function to derive schema PDA
pub fn derive_schema_pda(
    credential: Pubkey,
    schema_name: &str,
    version: u32,
    sas_program: Pubkey,
) -> Result<Pubkey> {
    let name_bytes = schema_name.as_bytes();
    let version_bytes = version.to_le_bytes();
    
    let seeds = &[
        b"schema",
        credential.as_ref(),
        name_bytes,
        &version_bytes,
    ];
    
    let (pda, _bump) = Pubkey::find_program_address(seeds, &sas_program);
    Ok(pda)
}

// Note: Using existing error codes from errors.rs instead of duplicating
