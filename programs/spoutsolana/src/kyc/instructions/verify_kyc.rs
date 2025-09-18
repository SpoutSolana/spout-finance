use anchor_lang::prelude::*;

use crate::errors::ErrorCode;
use crate::state::{Asset, Config, VerifyKycArgs};

pub fn handler(ctx: Context<VerifyKyc>, args: VerifyKycArgs) -> Result<()> {
    let asset = &ctx.accounts.asset;
    let config = &ctx.accounts.config;
    
    // Check if KYC is required for this asset and that a schema is configured
    require!(asset.kyc_required, ErrorCode::KycRequired);
    require!(asset.kyc_schema_id.is_some(), ErrorCode::KycRequired);
    
    // Verify the holder has a valid KYC attestation
    // This would integrate with SAS to verify the attestation
    // For now, we'll implement a basic check structure
    
    // TODO: Integrate with SAS program to verify attestation
    // The verification would check:
    // 1. The holder has an attestation for the specified schema
    // 2. The attestation is valid and not expired
    // 3. The attestation meets the asset's KYC requirements
    
    msg!("KYC verification for holder: {}", args.holder);
    msg!("Schema ID: {}", args.schema_id);

    // Ensure the provided schema matches the asset's configured schema
    let configured_schema = asset.kyc_schema_id.as_ref().unwrap();
    require!(configured_schema == &args.schema_id, ErrorCode::SchemaMismatch);
    
    // Basic structural checks against SAS program ownership
    require_keys_eq!(ctx.accounts.sas_program.key(), config.sas_program, ErrorCode::Unauthorized);
    require_keys_eq!(ctx.accounts.credential.owner, config.sas_program, ErrorCode::KycVerificationFailed);
    require_keys_eq!(ctx.accounts.schema.owner, config.sas_program, ErrorCode::KycVerificationFailed);
    
    Ok(())
}

#[derive(Accounts)]
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
    pub holder: UncheckedAccount<'info>,
    
    /// CHECK: SAS program for attestation verification
    /// In real implementation, this would be the SAS program ID
    pub sas_program: UncheckedAccount<'info>,

    /// CHECK: SAS credential account for the holder (owner must be SAS program)
    pub credential: UncheckedAccount<'info>,

    /// CHECK: SAS schema account (owner must be SAS program)
    pub schema: UncheckedAccount<'info>,
}
