use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{
        mint_to, transfer, burn, Mint, MintTo, Token, TokenAccount, Transfer, Burn,
    },
};
use std::str::FromStr;
use crate::sas_integration::*;

// SAS Program ID (you'll need to replace this with the actual SAS program ID)
declare_id!("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

#[program]
pub mod kyc_token {
    use super::*;

    // Initialize a KYC-gated token mint
    pub fn initialize_kyc_mint(
        ctx: Context<InitializeKycMint>,
        name: String,
        symbol: String,
        uri: String,
        initial_supply: u64,
    ) -> Result<()> {
        let mint = &mut ctx.accounts.mint;
        let authority = &mut ctx.accounts.authority;
        
        // Set mint authority to the program
        mint.mint_authority = COption::Some(ctx.accounts.program_authority.key());
        mint.supply = 0;
        mint.decimals = 9;
        mint.is_initialized = true;
        mint.freeze_authority = COption::Some(ctx.accounts.program_authority.key());
        
        // Mint initial supply to the authority if specified
        if initial_supply > 0 {
            let seeds = &[
                b"program_authority",
                &[ctx.bumps.program_authority],
            ];
            let signer = &[&seeds[..]];
            
            mint_to(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    MintTo {
                        mint: mint.to_account_info(),
                        to: ctx.accounts.authority_token_account.to_account_info(),
                        authority: ctx.accounts.program_authority.to_account_info(),
                    },
                    signer,
                ),
                initial_supply * 10u64.pow(mint.decimals as u32),
            )?;
        }
        
        Ok(())
    }

    // Mint tokens to a KYC-verified user
    pub fn mint_to_kyc_user(
        ctx: Context<MintToKycUser>,
        amount: u64,
    ) -> Result<()> {
        // Verify KYC status using SAS attestation
        verify_kyc_status(
            &ctx.accounts.attestation_account,
            &ctx.accounts.schema_account,
            ctx.accounts.credential_account.key(),
            ctx.accounts.schema_account.key(),
        )?;
        
        let mint = &ctx.accounts.mint;
        let seeds = &[
            b"program_authority",
            &[ctx.bumps.program_authority],
        ];
        let signer = &[&seeds[..]];
        
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: mint.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.program_authority.to_account_info(),
                },
                signer,
            ),
            amount * 10u64.pow(mint.decimals as u32),
        )?;
        
        Ok(())
    }

    // Transfer tokens between KYC-verified users
    pub fn transfer_kyc_tokens(
        ctx: Context<TransferKycTokens>,
        amount: u64,
    ) -> Result<()> {
        // Verify KYC status for both sender and receiver
        verify_kyc_status(&ctx.accounts.sender_attestation)?;
        verify_kyc_status(&ctx.accounts.receiver_attestation)?;
        
        let mint = &ctx.accounts.mint;
        
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.from_token_account.to_account_info(),
                    to: ctx.accounts.to_token_account.to_account_info(),
                    authority: ctx.accounts.from_authority.to_account_info(),
                },
            ),
            amount * 10u64.pow(mint.decimals as u32),
        )?;
        
        Ok(())
    }

    // Burn tokens from a KYC-verified user
    pub fn burn_kyc_tokens(
        ctx: Context<BurnKycTokens>,
        amount: u64,
    ) -> Result<()> {
        // Verify KYC status
        verify_kyc_status(&ctx.accounts.attestation_account)?;
        
        let mint = &ctx.accounts.mint;
        
        burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: mint.to_account_info(),
                    from: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.user_authority.to_account_info(),
                },
            ),
            amount * 10u64.pow(mint.decimals as u32),
        )?;
        
        Ok(())
    }
}

// Helper function to verify KYC status from SAS attestation
fn verify_kyc_status(
    attestation_account: &AccountInfo,
    schema_account: &AccountInfo,
    expected_credential: Pubkey,
    expected_schema: Pubkey,
) -> Result<()> {
    // Use the SAS integration module for verification
    let is_verified = sas_integration::verify_kyc_status(
        attestation_account,
        schema_account,
        expected_credential,
        expected_schema,
    )?;
    
    require!(is_verified, crate::errors::ErrorCode::KycVerificationFailed);
    
    Ok(())
}

// Account structures
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
        seeds = [b"program_authority"],
        bump,
        payer = authority,
    )]
    /// CHECK: This is a program-derived authority
    pub program_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
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
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: SAS attestation account for the user
    pub attestation_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS schema account
    pub schema_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS credential account
    pub credential_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS program
    #[account(address = sas_integration::SAS_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub sas_program: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"program_authority"],
        bump,
    )]
    /// CHECK: This is a program-derived authority
    pub program_authority: UncheckedAccount<'info>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferKycTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub from_token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub to_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: SAS attestation account for the sender
    pub sender_attestation: UncheckedAccount<'info>,
    
    /// CHECK: SAS attestation account for the receiver
    pub receiver_attestation: UncheckedAccount<'info>,
    
    pub from_authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnKycTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    
    /// CHECK: SAS attestation account for the user
    pub attestation_account: UncheckedAccount<'info>,
    
    pub user_authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

// Note: Using existing error codes from errors.rs instead of duplicating
