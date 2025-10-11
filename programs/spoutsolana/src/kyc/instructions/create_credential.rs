use anchor_lang::prelude::*;
use crate::errors::ErrorCode;
use crate::state::{Config, SasCredential, SasSchema, CreateCredentialArgs};

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

#[derive(Accounts)]
#[instruction(args: CreateCredentialArgs)]
pub struct CreateCredential<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    
    /// CHECK: The holder who will receive the credential
    pub holder: UncheckedAccount<'info>,
    
    /// The issuer of the credential (must match holder for self-issuance)
    pub issuer: Signer<'info>,
    
    /// SAS schema PDA for (schema_id) under SAS program
    #[account(
        seeds = [SasSchema::SEED_PREFIX, args.schema_id.as_bytes()],
        bump,
        seeds::program = config.sas_program
    )]
    pub schema: Account<'info, SasSchema>,

    /// SAS credential PDA for (holder, schema_id) under SAS program
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 4 + 32 + 8 + 1 + 1 + 1 + 4 + 1000, // Space for credential data
        seeds = [SasCredential::SEED_PREFIX, holder.key().as_ref(), args.schema_id.as_bytes()],
        bump
    )]
    pub credential: Account<'info, SasCredential>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

