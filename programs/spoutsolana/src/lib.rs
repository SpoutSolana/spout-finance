use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token::{Mint, Token, TokenAccount}};

declare_id!("EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB");

pub mod errors;
pub mod state;
pub mod kyc_token_simple;
pub mod sas_integration;

use crate::errors::ErrorCode;
use crate::state::*;
// removed legacy kyc/token instruction modules

#[program]
pub mod spoutsolana {
    use super::*;

    // Keep only KYC Token instructions

    // Initialize the Config PDA with the desired authority
    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        authority: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = authority;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    // KYC Token instructions
    pub fn initialize_kyc_mint(
        ctx: Context<InitializeKycMint>,
        name: String,
        symbol: String,
        uri: String,
        initial_supply: u64,
    ) -> Result<()> {
        kyc_token_simple::initialize_kyc_mint(ctx, name, symbol, uri, initial_supply)
    }

    pub fn mint_to_kyc_user(
        ctx: Context<MintToKycUser>,
        recipient: Pubkey,
        amount: u64,
    ) -> Result<()> {
        kyc_token_simple::mint_to_kyc_user(ctx, recipient, amount)
    }
}

// Initialize Config account
#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 1,
        seeds = [crate::state::Config::SEED],
        bump,
    )]
    pub config: Account<'info, crate::state::Config>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// Removed legacy Initialize/CreateAsset/VerifyKyc account structs

// KYC Token account structures
#[derive(Accounts)]
pub struct InitializeKycMint<'info> {
    #[account(
        init,
        payer = authority,
        mint::decimals = 9,
        mint::authority = program_authority,
        mint::freeze_authority = program_authority,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + 32,
        seeds = [b"program_authority", mint.key().as_ref()],
        bump,
    )]
    /// CHECK: This is a program-derived authority
    pub program_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    // /// CHECK: Metaplex Token Metadata program
    // #[account(address = mpl_token_metadata::ID)]
    // pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintToKycUser<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: SAS attestation account
    pub attestation_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS schema account
    pub schema_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS credential account
    pub credential_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS program
    #[account(address = sas_integration::SAS_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub sas_program: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"program_authority", mint.key().as_ref()],
        bump,
    )]
    /// CHECK: This is a program-derived authority
    pub program_authority: UncheckedAccount<'info>,
    
    /// CHECK: The recipient wallet (not a signer)
    pub recipient: UncheckedAccount<'info>,
    
    /// The authorized issuer who can mint
    #[account(mut)]
    pub issuer: Signer<'info>,
    
    // Config holding the expected authority
    #[account(
        seeds = [crate::state::Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, crate::state::Config>,

    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}