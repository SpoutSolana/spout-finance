use anchor_lang::prelude::*;

use crate::errors::ErrorCode;
use crate::kyc::assert_holder_is_kyc_verified;
use crate::state::{Asset, Config, VerifyKycArgs};

pub fn handler(ctx: Context<VerifyKyc>, args: VerifyKycArgs) -> Result<()> {
    let asset = &ctx.accounts.asset;
    
    // Check if KYC is required for this asset and that a schema is configured
    require!(asset.kyc_required, ErrorCode::KycRequired);
    require!(asset.kyc_schema_id.is_some(), ErrorCode::KycRequired);
    
    // Verify the holder has a valid KYC attestation via SAS (encapsulated helper)
    assert_holder_is_kyc_verified(
        &ctx.accounts.config,
        &ctx.accounts.sas_program.to_account_info(),
        &ctx.accounts.holder.to_account_info(),
        &args.schema_id,
        &ctx.accounts.credential.to_account_info(),
        &ctx.accounts.schema.to_account_info(),
    )?;

    // Ensure the provided schema matches the asset's configured schema
    let configured_schema = asset.kyc_schema_id.as_ref().unwrap();
    require!(configured_schema == &args.schema_id, ErrorCode::SchemaMismatch);
    
    // Structural check: schema must match the asset requirement (already enforced above)
    
    Ok(())
}

#[derive(Accounts)] // Input on-chain data as parameters for the handler function
#[instruction(args: VerifyKycArgs)]
pub struct VerifyKyc<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        seeds = [Asset::SEED_PREFIX, asset.mint.key().as_ref()],
        bump = asset.bump,
    )]
    pub asset: Account<'info, Asset>,
    
    /// CHECK: The holder whose KYC we're verifying
    // UncheckedAccount is used when we don't need to validate the account
    pub holder: UncheckedAccount<'info>,
    
    /// CHECK: SAS program for attestation verification
    /// In real implementation, this would be the SAS program ID
    pub sas_program: UncheckedAccount<'info>,

    /// CHECK: SAS credential PDA for (holder, schema_id) under SAS program
    /// seeds: [b"credential", holder, schema_id]
    #[account(
        seeds = [b"credential", holder.key().as_ref(), args.schema_id.as_bytes()],
        bump,
        seeds::program = sas_program.key()
    )]
    pub credential: UncheckedAccount<'info>,

    /// CHECK: SAS schema PDA for (schema_id) under SAS program
    /// seeds: [b"schema", schema_id]
    #[account(
        seeds = [b"schema", args.schema_id.as_bytes()],
        bump,
        seeds::program = sas_program.key()
    )]
    pub schema: UncheckedAccount<'info>,
}
