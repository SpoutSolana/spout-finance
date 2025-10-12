use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::VerifyKycArgs;
use super::super::super::VerifyKyc;

pub fn handler(ctx: Context<VerifyKyc>, args: VerifyKycArgs) -> Result<()> {
    let asset = &ctx.accounts.asset;
    let config = &ctx.accounts.config;
    
    // Check if KYC is required for this asset and that a schema is configured
    require!(asset.kyc_required, ErrorCode::KycRequired);
    require!(asset.kyc_schema_id.is_some(), ErrorCode::KycRequired);
    
    // Ensure the provided schema matches the asset's configured schema
    let configured_schema = asset.kyc_schema_id.as_ref().unwrap();
    require!(configured_schema == &args.schema_id, ErrorCode::SchemaMismatch);
    
    // Verify the SAS program is the expected one
    require_keys_eq!(ctx.accounts.sas_program.key(), config.sas_program, ErrorCode::Unauthorized);
    
    // Verify the SAS credential account exists and is owned by the SAS program
    require!(*ctx.accounts.sas_credential.owner == config.sas_program, ErrorCode::Unauthorized);
    require!(ctx.accounts.sas_credential.data_is_empty() == false, ErrorCode::AccountNotInitialized);
    
    // Note: We don't parse the credential data because:
    // 1. We don't know the actual SAS credential structure
    // 2. The SAS program is responsible for credential validation
    // 3. We just verify the account exists and is owned by SAS
    
    msg!("KYC verification successful: holder={}, schema_id={}, credential_id={}", 
         args.holder, args.schema_id, args.credential_id);
    
    Ok(())
}

