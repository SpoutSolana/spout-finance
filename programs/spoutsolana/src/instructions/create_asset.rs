use anchor_lang::prelude::*;

use crate::errors::ErrorCode;
use crate::state::{Asset, Config, CreateAssetArgs, MAX_NAME_LEN, MAX_SYMBOL_LEN};

pub fn handler(ctx: Context<CreateAsset>, args: CreateAssetArgs) -> Result<()> {
    require_keys_eq!(ctx.accounts.config.authority, ctx.accounts.authority.key(), ErrorCode::Unauthorized);

    require!(args.name.len() <= MAX_NAME_LEN, ErrorCode::NameTooLong);
    require!(args.symbol.len() <= MAX_SYMBOL_LEN, ErrorCode::SymbolTooLong);

    let asset = &mut ctx.accounts.asset;
    asset.mint = ctx.accounts.mint.key();
    asset.issuer = ctx.accounts.authority.key();
    asset.name = args.name;
    asset.symbol = args.symbol;
    asset.total_supply = args.total_supply;
    asset.bump = ctx.bumps.asset;
    Ok(())
}

#[derive(Accounts)]
#[instruction(args: CreateAssetArgs)]
pub struct CreateAsset<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32 + 4 + MAX_NAME_LEN + 4 + MAX_SYMBOL_LEN + 8 + 1,
        seeds = [Asset::SEED_PREFIX, mint.key().as_ref()],
        bump
    )]
    pub asset: Account<'info, Asset>,

    /// CHECK: RWA token mint, validated off-chain or in further extensions
    pub mint: UncheckedAccount<'info>,

    pub authority: Signer<'info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}


