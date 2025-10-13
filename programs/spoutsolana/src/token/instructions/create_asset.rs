use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::{CreateAssetArgs, MAX_NAME_LEN, MAX_SYMBOL_LEN, MAX_KYC_SCHEMA_ID_LEN};
use super::super::super::CreateAsset;

pub fn handler(ctx: Context<CreateAsset>, args: CreateAssetArgs) -> Result<()> {
    require_keys_eq!(ctx.accounts.config.authority, ctx.accounts.authority.key(), ErrorCode::Unauthorized);

    require!(args.name.len() <= MAX_NAME_LEN, ErrorCode::NameTooLong);
    require!(args.symbol.len() <= MAX_SYMBOL_LEN, ErrorCode::SymbolTooLong);
    
    if let Some(ref schema_id) = args.kyc_schema_id {
        require!(schema_id.len() <= MAX_KYC_SCHEMA_ID_LEN, ErrorCode::SchemaIdTooLong);
    }

    let asset = &mut ctx.accounts.asset;
    // Comment: What is the mint field 
    asset.mint = ctx.accounts.mint.key();
    asset.issuer = ctx.accounts.authority.key();
    asset.name = args.name;
    asset.symbol = args.symbol;
    asset.total_supply = args.total_supply;
    asset.kyc_required = args.kyc_required;
    // Comment: Optional, depends if we are going to tie schema to the asset 
    asset.kyc_schema_id = args.kyc_schema_id;
    asset.bump = ctx.bumps.asset;
    Ok(())
}

