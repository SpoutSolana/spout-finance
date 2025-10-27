use anchor_lang::prelude::*;
use anchor_spl::{
    token::{mint_to, MintTo},
};
use crate::{sas_integration::*, InitializeKycMint, MintToKycUser};
use std::time::{SystemTime, UNIX_EPOCH};
use anchor_spl::token::spl_token::state::Mint as SplMint;

// Helper function to derive attestation PDA (from Rust example)
fn derive_attestation_pda(
    credential_pda: &Pubkey,
    schema_pda: &Pubkey,
    nonce: &Pubkey,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"attestation",
            &credential_pda.to_bytes(),
            &schema_pda.to_bytes(),
            &nonce.to_bytes(),
        ],
        &SAS_PROGRAM_ID.parse::<Pubkey>().unwrap(),
    )
}

// Verify attestation function (adapted from Rust example)
fn verify_attestation(
    schema_pda: &Pubkey,
    user_address: &Pubkey,
    credential_pda: &Pubkey,
    attestation_account: &AccountInfo,
) -> Result<bool> {
    // Check if attestation account exists and has data
    if attestation_account.data_is_empty() {
        return Ok(false);
    }
    
    // Derive attestation PDA to verify it matches
    let (expected_attestation_pda, _bump) = derive_attestation_pda(credential_pda, schema_pda, user_address);
    
    // Verify the account key matches the expected PDA
    if attestation_account.key() != expected_attestation_pda {
        return Ok(false);
    }
    
    // Deserialize attestation account data
    let attestation_data = attestation_account.data.borrow();
    
    // Skip the 8-byte discriminator and deserialize the attestation
    let attestation = match SasAttestation::try_from_slice(&attestation_data[8..]) {
        Ok(att) => att,
        Err(_) => return Ok(false),
    };
    
    // Check if attestation is expired
    let current_timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    
    if current_timestamp >= attestation.expiry {
        return Ok(false);
    }
    
    // Verify the nonce matches the user address
    if attestation.nonce != *user_address {
        return Ok(false);
    }
    
    // Check KYC status from attestation data
    // Based on our schema, it should be [1, 0] for kycCompleted: 1
    if attestation.data.len() < 1 {
        return Ok(false);
    }
    
    // Check if kycCompleted is true (1)
    let kyc_completed = attestation.data[0] == 1;
    
    Ok(kyc_completed)
}

// Initialize a KYC-gated token mint
pub fn initialize_kyc_mint(
    _ctx: Context<InitializeKycMint>,
    _name: String,
    _symbol: String,
    _uri: String,
    _initial_supply: u64,
) -> Result<()> {
    // Mint is initialized by Anchor with the constraints specified in InitializeKycMint
    Ok(())
}

// Mint tokens to a KYC-verified user
pub fn mint_to_kyc_user(
    ctx: Context<MintToKycUser>,
    amount: u64,
) -> Result<()> {
    // Verify KYC status using the Rust example's verify_attestation function
    let is_verified = verify_attestation(
        &ctx.accounts.schema_account.key(),
        &ctx.accounts.user.key(),
        &ctx.accounts.credential_account.key(),
        &ctx.accounts.attestation_account,
    )?;
    
    require!(is_verified, crate::errors::ErrorCode::KycVerificationFailed);
    
    // Create seeds array for PDA signing
    let bump_seed = [ctx.bumps.program_authority];
    let seeds: &[&[u8]] = &[b"program_authority", &bump_seed];
    let signer_seeds = &[seeds];
    
    // Mint tokens using CPI
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.user_token_account.to_account_info(),
        authority: ctx.accounts.program_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    
    mint_to(cpi_ctx, amount * 10u64.pow(ctx.accounts.mint.decimals as u32))?;
    
    Ok(())
}
