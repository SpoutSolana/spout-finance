use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::CreateCredentialArgs;
use super::super::super::CreateCredential;

pub fn handler(ctx: Context<CreateCredential>, args: CreateCredentialArgs) -> Result<()> {
    let credential = &mut ctx.accounts.credential;
    let schema = &ctx.accounts.schema;
    let config = &ctx.accounts.config;
    
    // Verify the schema exists and is valid
    require!(schema.schema_id == args.schema_id, ErrorCode::SchemaMismatch);
    
    // Verify the issuer is the holder (self-issuance)
    require_keys_eq!(ctx.accounts.issuer.key(), args.holder, ErrorCode::Unauthorized);
    
    // Initialize the credential
    credential.holder = args.holder;
    credential.schema_id = args.schema_id;
    credential.issuer = config.authority; // Use the authority from config as the issuer
    credential.issued_at = Clock::get()?.unix_timestamp;
    credential.expires_at = args.expires_at;
    credential.revoked = false;
    credential.data = args.credential_data;
    credential.bump = ctx.bumps.credential;
    
    Ok(())
}


