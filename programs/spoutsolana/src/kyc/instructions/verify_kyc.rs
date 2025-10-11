use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::kyc::assert_holder_is_kyc_verified;
use crate::state::VerifyKycArgs;
use super::super::super::VerifyKyc;

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

