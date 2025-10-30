use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022,
    token_interface::{TokenInterface},
};
use crate::{sas_integration::*, CheckTokenBalance, BurnFromKycUser};
// use mpl_token_metadata::instruction::create_metadata_accounts_v3;
// use mpl_token_metadata::state::DataV2;
// Removed std::time usage; use Clock in on-chain paths when needed
use anchor_spl::token::spl_token::state::Mint as SplMint;
use anchor_spl::token_2022::spl_token_2022;

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

// (Legacy v1 mint helpers removed)


pub fn mint_to_kyc_user_2022(
    ctx: Context<crate::MintToKycUser2022>,
    recipient: Pubkey,
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
        &recipient,
        &ctx.accounts.credential_account.key(),
        &ctx.accounts.attestation_account,
    )?;
    require!(is_verified, crate::errors::ErrorCode::KycVerificationFailed);

    // Build Token-2022 mint_to ix with PDA authority
    let decimals = ctx.accounts.mint.decimals as u32;
    let amount_base_units = amount
        .checked_mul(10u64.pow(decimals))
        .ok_or(crate::errors::ErrorCode::Unauthorized)?;

    let ix = spl_token_2022::instruction::mint_to(
        &token_2022::ID,
        &ctx.accounts.mint.key(),
        &ctx.accounts.recipient_token_account.key(),
        &ctx.accounts.program_authority.key(),
        &[],
        amount_base_units,
    ).map_err(|_| crate::errors::ErrorCode::Unauthorized)?;

    let bump_seed = [ctx.bumps.program_authority];
    let mint_key = ctx.accounts.mint.key();
    let signer_seeds: &[&[&[u8]]] = &[&[b"program_authority", mint_key.as_ref(), &bump_seed]];

    anchor_lang::solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.recipient_token_account.to_account_info(),
            ctx.accounts.program_authority.to_account_info(),
        ],
        signer_seeds,
    )?;

    Ok(())
}

// Emit an event with the SPL token account balance (on-chain read only)
pub fn check_token_balance(
    ctx: Context<CheckTokenBalance>,
) -> Result<()> {
    let ata = &ctx.accounts.token_account;
    emit!(crate::TokenBalanceChecked {
        owner: ata.owner,
        mint: ata.mint,
        amount: ata.amount,
    });
    Ok(())
}

// Burn tokens from a KYC-verified user (owner must sign)
pub fn burn_from_kyc_user(
    ctx: Context<BurnFromKycUser>,
    amount: u64,
) -> Result<()> {
    // Enforce only configured authority can authorize burns
    require_keys_eq!(
        ctx.accounts.config.authority,
        ctx.accounts.issuer.key(),
        crate::errors::ErrorCode::Unauthorized
    );

    // Burn via Token-2022 using PermanentDelegate (authority = program_authority)
    let decimals = ctx.accounts.mint.decimals as u32;
    let amount_base_units = amount
        .checked_mul(10u64.pow(decimals))
        .ok_or(crate::errors::ErrorCode::Unauthorized)?;

    let ix = spl_token_2022::instruction::burn(
        &token_2022::ID,
        &ctx.accounts.owner_token_account.key(),
        &ctx.accounts.mint.key(),
        &ctx.accounts.program_authority.key(),
        &[],
        amount_base_units,
    ).map_err(|_| crate::errors::ErrorCode::Unauthorized)?;

    let bump_seed = [ctx.bumps.program_authority];
    let mint_key = ctx.accounts.mint.key();
    let signer_seeds: &[&[&[u8]]] = &[&[b"program_authority", mint_key.as_ref(), &bump_seed]];

    anchor_lang::solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.accounts.owner_token_account.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.program_authority.to_account_info(),
        ],
        signer_seeds,
    )?;

    Ok(())
}

// Token-2022: Transfer using PDA delegate, enforcing recipient KYC
pub fn transfer_kyc_checked_2022(
    ctx: Context<crate::TransferKycChecked2022>,
    from_owner: Pubkey,
    to_recipient: Pubkey,
    amount: u64,
) -> Result<()> {
    // Only configured authority can authorize transfer
    require_keys_eq!(
        ctx.accounts.config.authority,
        ctx.accounts.issuer.key(),
        crate::errors::ErrorCode::Unauthorized
    );

    // Make sure account owners line up
    require_keys_eq!(ctx.accounts.from_owner.key(), from_owner, crate::errors::ErrorCode::Unauthorized);

    // Verify KYC for recipient
    let is_verified = verify_attestation(
        &ctx.accounts.schema_account.key(),
        &to_recipient,
        &ctx.accounts.credential_account.key(),
        &ctx.accounts.attestation_account,
    )?;
    require!(is_verified, crate::errors::ErrorCode::KycVerificationFailed);

    // Amount to base units
    let decimals = ctx.accounts.mint.decimals as u32;
    let amount_base_units = amount
        .checked_mul(10u64.pow(decimals))
        .ok_or(crate::errors::ErrorCode::Unauthorized)?;

    // Transfer via PDA (PermanentDelegate)
    let ix = spl_token_2022::instruction::transfer(
        &token_2022::ID,
        &ctx.accounts.from_token_account.key(),
        &ctx.accounts.to_token_account.key(),
        &ctx.accounts.program_authority.key(),
        &[],
        amount_base_units,
    ).map_err(|_| crate::errors::ErrorCode::Unauthorized)?;

    let bump_seed = [ctx.bumps.program_authority];
    let mint_key = ctx.accounts.mint.key();
    let signer_seeds: &[&[&[u8]]] = &[&[b"program_authority", mint_key.as_ref(), &bump_seed]];

    anchor_lang::solana_program::program::invoke_signed(
        &ix,
        &[
            ctx.accounts.from_token_account.to_account_info(),
            ctx.accounts.to_token_account.to_account_info(),
            ctx.accounts.program_authority.to_account_info(),
        ],
        signer_seeds,
    )?;

    Ok(())
}

// Token-2022: User-initiated transfer; sender signs; both sender and recipient must be KYC-attested
pub fn user_transfer_kyc_checked_2022(
    ctx: Context<crate::UserTransferKycChecked2022>,
    amount: u64,
) -> Result<()> {
    // Verify sender KYC
    let sender_ok = verify_attestation(
        &ctx.accounts.schema_account.key(),
        &ctx.accounts.from_owner.key(),
        &ctx.accounts.credential_account.key(),
        &ctx.accounts.sender_attestation_account,
    )?;
    require!(sender_ok, crate::errors::ErrorCode::KycVerificationFailed);

    // Verify recipient KYC
    let recipient_ok = verify_attestation(
        &ctx.accounts.schema_account.key(),
        &ctx.accounts.to_recipient.key(),
        &ctx.accounts.credential_account.key(),
        &ctx.accounts.recipient_attestation_account,
    )?;
    require!(recipient_ok, crate::errors::ErrorCode::KycVerificationFailed);

    // Convert amount
    let decimals = ctx.accounts.mint.decimals as u32;
    let amount_base_units = amount
        .checked_mul(10u64.pow(decimals))
        .ok_or(crate::errors::ErrorCode::Unauthorized)?;

    // Transfer with sender authority (checked)
    let ix = spl_token_2022::instruction::transfer_checked(
        &token_2022::ID,
        &ctx.accounts.from_token_account.key(),
        &ctx.accounts.mint.key(),
        &ctx.accounts.to_token_account.key(),
        &ctx.accounts.from_owner.key(),
        &[],
        amount_base_units,
        u8::try_from(decimals).unwrap(),
    ).map_err(|_| crate::errors::ErrorCode::Unauthorized)?;

    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.from_token_account.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.to_token_account.to_account_info(),
            ctx.accounts.from_owner.to_account_info(),
        ],
    )?;

    Ok(())
}
