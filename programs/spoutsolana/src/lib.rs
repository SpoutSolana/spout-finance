use anchor_lang::prelude::*;

declare_id!("EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB");

pub mod errors;
pub mod state;
pub mod kyc;
pub mod token;

use crate::errors::ErrorCode;
use crate::state::*;
use kyc::instructions::*;
use token::instructions::*;

#[program]
pub mod spoutsolana {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
        kyc::instructions::initialize::handler(ctx, args)
    }

    pub fn create_asset(ctx: Context<CreateAsset>, args: CreateAssetArgs) -> Result<()> {
        token::instructions::create_asset::handler(ctx, args)
    }

    pub fn verify_kyc(ctx: Context<VerifyKyc>, args: VerifyKycArgs) -> Result<()> {
        kyc::instructions::verify_kyc::handler(ctx, args)
    }

    pub fn create_credential(ctx: Context<CreateCredential>, args: CreateCredentialArgs) -> Result<()> {
        kyc::instructions::create_credential::handler(ctx, args)
    }

    pub fn create_schema(ctx: Context<CreateSchema>, args: CreateSchemaArgs) -> Result<()> {
        kyc::instructions::create_schema::handler(ctx, args)
    }
}

// Initialize instruction
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32 + 1,
        seeds = [Config::SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Create Asset instruction
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
        space = 8 + 32 + 32 + 4 + MAX_NAME_LEN + 4 + MAX_SYMBOL_LEN + 8 + 1 + 1 + (1 + 4 + MAX_KYC_SCHEMA_ID_LEN),
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

// Verify KYC instruction
#[derive(Accounts)] // Input on-chain data as parameters for the handler function
#[instruction(args: VerifyKycArgs)] // Makes instruction args available in account constraints
pub struct VerifyKyc<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    
    /// Asset PDA for (mint) under our program
    #[account(
        seeds = [Asset::SEED_PREFIX, asset.mint.key().as_ref()],
        bump = asset.bump,
    )]
    pub asset: Account<'info, Asset>,
    
    /// CHECK: The holder whose KYC status is being verified
    pub holder: UncheckedAccount<'info>,
    
    /// CHECK: SAS program for attestation verification
    /// In real implementation, this would be the SAS program ID
    pub sas_program: UncheckedAccount<'info>,

    /// Credential PDA for (holder, schema_id) under our program
    /// seeds: [b"credential", holder, schema_id]
    #[account(
        seeds = [SasCredential::SEED_PREFIX, holder.key().as_ref(), args.schema_id.as_bytes()],
        bump
    )]
    pub credential: Account<'info, SasCredential>,

    /// Schema PDA for (schema_id) under our program
    /// seeds: [b"schema", schema_id]
    #[account(
        seeds = [SasSchema::SEED_PREFIX, args.schema_id.as_bytes()],
        bump
    )]
    pub schema: Account<'info, SasSchema>,
}

// Create Credential instruction
#[derive(Accounts)]
#[instruction(args: CreateCredentialArgs)]
pub struct CreateCredential<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    
    /// CHECK: The holder of the credential
    pub holder: UncheckedAccount<'info>,
    
    /// The issuer of the credential (must match holder for self-issuance)
    pub issuer: Signer<'info>,
    
    /// Schema PDA for (schema_id) under our program
    #[account(
        seeds = [SasSchema::SEED_PREFIX, args.schema_id.as_bytes()],
        bump
    )]
    pub schema: Account<'info, SasSchema>,

    /// Credential PDA for (holder, schema_id) under our program
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

// Create Schema instruction
#[derive(Accounts)]
#[instruction(args: CreateSchemaArgs)]
pub struct CreateSchema<'info> {
    #[account(
        seeds = [Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    
    /// The issuer of the schema (must be the authority)
    pub issuer: Signer<'info>,
    
    /// Schema PDA for (schema_id) under our program
    #[account(
        init,
        payer = payer,
        space = 8 + 4 + 32 + 8 + 4 + (args.fields.len() * (4 + 32 + 1 + 1)) + 1, // Space for schema data
        seeds = [SasSchema::SEED_PREFIX, args.schema_id.as_bytes()],
        bump
    )]
    pub schema: Account<'info, SasSchema>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}






