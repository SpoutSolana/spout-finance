use anchor_lang::prelude::*;

declare_id!("GpisZcCukL4xJjaeXJpUshVbrgzUojyGNHNAmorXj2Nx");

pub mod errors;
pub mod state;
pub mod kyc;
pub mod token;

use crate::errors::ErrorCode;
use crate::state::*;
use kyc::instructions::*;
use token::instructions::*;

#[program]
pub mod spoutsolana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
        kyc::instructions::initialize::handler(ctx, args)
    }

    pub fn create_asset(ctx: Context<CreateAsset>, args: CreateAssetArgs) -> Result<()> {
        token::instructions::create_asset::handler(ctx, args)
    }

    pub fn verify_kyc(ctx: Context<VerifyKyc>, args: VerifyKycArgs) -> Result<()> {
        kyc::instructions::verify_kyc::handler(ctx, args)
    }

    pub fn create_credential(ctx: Context<CreateCredential>, args: CreateCredentialArgs) -> Result<()> {
        kyc::instructions::create_credential::handler(ctx, args)
    }
}



