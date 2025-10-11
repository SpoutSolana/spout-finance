use anchor_lang::prelude::*;

use crate::errors::ErrorCode;
use crate::kyc::assert_holder_is_kyc_verified;
use crate::state::{Asset, Config, VerifyKycArgs, SasCredential, SasSchema};

pub fn handler(ctx: Context<VerifyKyc>, args: VerifyKycArgs) -> Result<()> {
    let asset = &ctx.accounts.asset;
    let credential = &ctx.accounts.credential;
    let schema = &ctx.accounts.schema;
    
    // Check if KYC is required for this asset and that a schema is configured
    require!(asset.kyc_required, ErrorCode::KycRequired);
    require!(asset.kyc_schema_id.is_some(), ErrorCode::KycRequired);
    
    // Ensure the provided schema matches the asset's configured schema
    let configured_schema = asset.kyc_schema_id.as_ref().unwrap();
    require!(configured_schema == &args.schema_id, ErrorCode::SchemaMismatch);
    
    // Verify the holder matches the credential holder
    require_keys_eq!(credential.holder, args.holder, ErrorCode::KycVerificationFailed);
    
    // Verify the schema ID matches
    require!(credential.schema_id == args.schema_id, ErrorCode::SchemaMismatch);
    require!(schema.schema_id == args.schema_id, ErrorCode::SchemaMismatch);
    
    // Check if credential is not revoked
    require!(!credential.revoked, ErrorCode::KycVerificationFailed);
    
    // Check if credential is not expired (if expiry is set)
    if let Some(expires_at) = credential.expires_at {
        let clock = Clock::get()?;
        require!(clock.unix_timestamp < expires_at, ErrorCode::KycVerificationFailed);
    }
    
    // Verify the holder has a valid KYC attestation via SAS (encapsulated helper)
    assert_holder_is_kyc_verified(
        &ctx.accounts.config,
        &ctx.accounts.sas_program.to_account_info(),
        &ctx.accounts.holder.to_account_info(),
        &args.schema_id,
        &ctx.accounts.credential.to_account_info(),
        &ctx.accounts.schema.to_account_info(),
    )?;
    
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

    /// SAS credential PDA for (holder, schema_id) under SAS program
    /// seeds: [b"credential", holder, schema_id]
    #[account(
        seeds = [SasCredential::SEED_PREFIX, holder.key().as_ref(), args.schema_id.as_bytes()],
        bump,
        seeds::program = sas_program.key()
    )]
    pub credential: Account<'info, SasCredential>,

    /// SAS schema PDA for (schema_id) under SAS program
    /// seeds: [b"schema", schema_id]
    #[account(
        seeds = [SasSchema::SEED_PREFIX, args.schema_id.as_bytes()],
        bump,
        seeds::program = sas_program.key()
    )]
    pub schema: Account<'info, SasSchema>,
}
