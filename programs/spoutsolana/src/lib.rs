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
        // Seed should be unique identifier for the specific asset, not the minter key. So something like
        // ticker of something that uniquely identifies the asset
        seeds = [Asset::SEED_PREFIX, mint.key().as_ref()],
        bump
    )]
    pub asset: Account<'info, Asset>,

    /// CHECK: RWA token mint, validated off-chain or in further extensions
    // Comment: Why not use mint as part of the asset validation logic 
    pub mint: UncheckedAccount<'info>,
    // Comment: is authority validated randomly just that the Signer exists?
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
    pub sas_program: UncheckedAccount<'info>,

    /// CHECK: SAS Schema PDA - derived using ["schema", schema_id]
    #[account(
        seeds = [b"schema", args.schema_id.as_bytes()],
        seeds::program = config.sas_program,
        bump
    )]
    pub sas_schema: UncheckedAccount<'info>,

    /// CHECK: SAS Credential PDA - derived using ["credential", schema_pda, credential_id]
    #[account(
        seeds = [b"credential", sas_schema.key().as_ref(), args.credential_id.as_bytes()],
        seeds::program = config.sas_program,
        bump
    )]
    pub sas_credential: UncheckedAccount<'info>,
}







