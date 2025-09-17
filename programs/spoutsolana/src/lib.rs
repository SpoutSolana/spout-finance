use anchor_lang::prelude::*;

declare_id!("GpisZcCukL4xJjaeXJpUshVbrgzUojyGNHNAmorXj2Nx");

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

#[program]
pub mod spoutsolana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
        initialize::handler(ctx, args)
    }

    pub fn create_asset(ctx: Context<CreateAsset>, args: CreateAssetArgs) -> Result<()> {
        create_asset::handler(ctx, args)
    }
}
