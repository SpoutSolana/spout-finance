use anchor_lang::prelude::*;

pub const MAX_NAME_LEN: usize = 64;
pub const MAX_SYMBOL_LEN: usize = 16;

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub bump: u8,
}

impl Config {
    pub const SEED: &'static [u8] = b"config";
}

#[account]
pub struct Asset {
    pub mint: Pubkey,
    pub issuer: Pubkey,
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
    pub bump: u8,
}

impl Asset {
    pub const SEED_PREFIX: &'static [u8] = b"asset";
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeArgs {
    pub authority: Pubkey,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateAssetArgs {
    pub name: String,
    pub symbol: String,
    pub total_supply: u64,
}


