use anchor_lang::prelude::*;

declare_id!("GpisZcCukL4xJjaeXJpUshVbrgzUojyGNHNAmorXj2Nx");

pub mod errors;
pub mod kyc;
pub mod state;

use kyc::*;

// In calls like `verify_kyc::handler(...)`, `verify_kyc` is a Rust module path.
// It usually comes from the file name and `pub mod` in `kyc/instructions/mod.rs`,
// but you can alias it there without renaming the file. The instruction name itself
// comes from the function in `#[program]` (e.g., `pub fn verify_kyc(...)`).
#[program]
pub mod spoutsolana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
        initialize::handler(ctx, args)
    }

    pub fn create_asset(ctx: Context<CreateAsset>, args: CreateAssetArgs) -> Result<()> {
        create_asset::handler(ctx, args)
    }

    pub fn verify_kyc(ctx: Context<VerifyKyc>, args: VerifyKycArgs) -> Result<()> {
        verify_kyc::handler(ctx, args)
    }
}
