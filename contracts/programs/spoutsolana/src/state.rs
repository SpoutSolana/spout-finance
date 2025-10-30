use anchor_lang::prelude::*;

// Minimal state kept for KYC-gated token flow

#[account]
pub struct Config {
    pub authority: Pubkey, // Trusted issuer of tokens
    pub bump: u8,          // Bump seed for the config account
}

impl Config {
    pub const SEED: &'static [u8] = b"config_v2";
}




