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

// Note: SasSchema is not needed since we only use it for PDA derivation
// and never read from the schema account itself

// Note: We don't define SasCredential here because:
// 1. It belongs to the SAS program, not our program
// 2. We don't know the actual structure of SAS credentials
// 3. We should use UncheckedAccount and parse manually if needed

// Note: SasSchemaField and SasFieldType are not needed since we don't
// create or validate schemas in our program


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
    pub credential_id: String,  // Added for SAS credential PDA derivation
}



