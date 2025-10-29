use anchor_lang::prelude::*;
use anchor_spl::{
    token::{mint_to, MintTo},
};
use crate::{sas_integration::*, InitializeKycMint, MintToKycUser};
// use mpl_token_metadata::instruction::create_metadata_accounts_v3;
// use mpl_token_metadata::state::DataV2;
// Removed std::time usage; use Clock in on-chain paths when needed
use anchor_spl::token::spl_token::state::Mint as SplMint;

// Use shared PDA helper from sas_integration

// Verify attestation function (adapted from Rust example)
fn verify_attestation(
    schema_pda: &Pubkey,
    user_address: &Pubkey,
    credential_pda: &Pubkey,
    attestation_account: &AccountInfo,
) -> Result<bool> {
    if attestation_account.data_is_empty() {
        return Ok(false);
    }

    // Owner must be SAS program
    let sas_program = SAS_PROGRAM_ID.parse::<Pubkey>().unwrap();
    if attestation_account.owner != &sas_program {
        msg!("Attestation not owned by SAS program");
        return Ok(false);
    }

    // PDA must match SAS seeds: credential + schema + nonce(user)
    let (expected_pda, _) = crate::sas_integration::derive_attestation_pda(credential_pda, schema_pda, user_address);
    if attestation_account.key() != expected_pda {
        msg!("Attestation PDA mismatch. Expected {}", expected_pda);
        return Ok(false);
    }

    Ok(true)
}

// Initialize a KYC-gated token mint
pub fn initialize_kyc_mint(
    ctx: Context<InitializeKycMint>,
    name: String,
    symbol: String,
    uri: String,
    _initial_supply: u64,
) -> Result<()> {
    // Mint is initialized by Anchor with the constraints specified in InitializeKycMint

    // TODO: Add Metaplex metadata creation here
    msg!("Created token: {} ({})", name, symbol);

    Ok(())
}

// Mint tokens to a KYC-verified recipient (called by authorized issuer)
pub fn mint_to_kyc_user(
    ctx: Context<MintToKycUser>,
    recipient: Pubkey,  // ← Recipient wallet (not a signer)
    amount: u64,
) -> Result<()> {
    // Enforce only configured authority can mint
    require_keys_eq!(
        ctx.accounts.config.authority,
        ctx.accounts.issuer.key(),
        crate::errors::ErrorCode::Unauthorized
    );

    // Verify KYC status for the recipient
    let is_verified = verify_attestation(
        &ctx.accounts.schema_account.key(),
        &recipient,  // ← Use the recipient parameter
        &ctx.accounts.credential_account.key(),
        &ctx.accounts.attestation_account,
    )?;
    
    require!(is_verified, crate::errors::ErrorCode::KycVerificationFailed);
    
    // Create seeds array for PDA signing
    let bump_seed = [ctx.bumps.program_authority];
    let mint_key = ctx.accounts.mint.key();
    let seeds: &[&[u8]] = &[b"program_authority", mint_key.as_ref(), &bump_seed];
    let signer_seeds = &[seeds];
    
    // Mint tokens using CPI
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.recipient_token_account.to_account_info(),  // ← Mint to recipient's token account
        authority: ctx.accounts.program_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
    
    mint_to(cpi_ctx, amount * 10u64.pow(ctx.accounts.mint.decimals as u32))?;
    
    Ok(())
}
