use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::CreateSchemaArgs;
use super::super::super::CreateSchema;

pub fn handler(ctx: Context<CreateSchema>, args: CreateSchemaArgs) -> Result<()> {
    let schema = &mut ctx.accounts.schema;
    let config = &ctx.accounts.config;
    
    // Verify the schema ID matches
    require!(schema.schema_id == args.schema_id, ErrorCode::SchemaMismatch);
    
    // Verify the issuer is the authority
    require_keys_eq!(ctx.accounts.issuer.key(), config.authority, ErrorCode::Unauthorized);
    
    // Initialize the schema
    schema.schema_id = args.schema_id;
    schema.issuer = config.authority;
    schema.created_at = Clock::get()?.unix_timestamp;
    schema.fields = args.fields;
    schema.bump = ctx.bumps.schema;
    
    Ok(())
}







