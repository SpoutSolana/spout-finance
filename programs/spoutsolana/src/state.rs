use anchor_lang::prelude::*;

pub const MAX_NAME_LEN: usize = 64;
pub const MAX_SYMBOL_LEN: usize = 16;
pub const MAX_KYC_SCHEMA_ID_LEN: usize = 64;


// Under accounts all the state storage is defined
#[account]
pub struct Config {
    pub authority: Pubkey,
    pub sas_program: Pubkey,
    pub bump: u8,
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


