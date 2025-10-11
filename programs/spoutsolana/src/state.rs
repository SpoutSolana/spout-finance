use anchor_lang::prelude::*;

pub const MAX_NAME_LEN: usize = 64;
pub const MAX_SYMBOL_LEN: usize = 16;
pub const MAX_KYC_SCHEMA_ID_LEN: usize = 64;


// Under accounts all the state storage is defined
#[account]
pub struct Config {
    pub authority: Pubkey, // Trusted issuer of the assets created 
    pub sas_program: Pubkey, // SAS program id
    pub bump: u8, // Bump seed for the config account
}

impl Config {
    pub const SEED: &'static [u8] = b"config";
}

// Under accounts all the state storage is defined
#[account]
pub struct Asset {
    pub mint: Pubkey,
    pub issuer: Pubkey,
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub kyc_required: bool,
    pub kyc_schema_id: Option<String>,
    pub bump: u8,
}

impl Asset {
    pub const SEED_PREFIX: &'static [u8] = b"asset";
}

// SAS (Solana Attestation Service) related structures
// These represent the data structures that SAS manages

/// SAS Schema account structure
/// This represents a schema definition in the SAS program
#[account]
pub struct SasSchema {
    pub schema_id: String,
    pub issuer: Pubkey,
    pub created_at: i64,
    pub fields: Vec<SasSchemaField>,
    pub bump: u8,
}

impl SasSchema {
    pub const SEED_PREFIX: &'static [u8] = b"schema";
}

/// SAS Credential account structure  
/// This represents a credential/attestation issued by SAS
#[account]
pub struct SasCredential {
    pub holder: Pubkey,
    pub schema_id: String,
    pub issuer: Pubkey,
    pub issued_at: i64,
    pub expires_at: Option<i64>,
    pub revoked: bool,
    pub data: Vec<u8>, // Serialized credential data
    pub bump: u8,
}

impl SasCredential {
    pub const SEED_PREFIX: &'static [u8] = b"credential";
}

/// SAS Schema field definition
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct SasSchemaField {
    pub name: String,
    pub field_type: SasFieldType,
    pub required: bool,
}

/// SAS field types
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum SasFieldType {
    String,
    Number,
    Boolean,
    Date,
    Address,
}


// The structs below define instruction argument payloads used by handlers in `lib.rs`.
// They are serialized/deserialized via Anchor using #[derive(AnchorSerialize, AnchorDeserialize, Clone)].
// These values are provided in the transaction; they are not persisted unless your instruction writes them to accounts.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeArgs {
    pub authority: Pubkey,
    pub sas_program: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateAssetArgs {
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub kyc_required: bool,
    pub kyc_schema_id: Option<String>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VerifyKycArgs {
    pub holder: Pubkey,
    pub schema_id: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateCredentialArgs {
    pub holder: Pubkey,
    pub schema_id: String,
    pub expires_at: Option<i64>,
    pub credential_data: Vec<u8>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateSchemaArgs {
    pub schema_id: String,
    pub fields: Vec<SasSchemaField>,
}


