use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
    token_interface::{Mint as MintInterface, TokenAccount as TokenAccountInterface, TokenInterface},
    token_2022::Token2022,
};

declare_id!("EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB");

pub mod errors;
pub mod state;
pub mod permissionedToken;
pub mod sas_integration;
pub mod orders;
pub mod price_feed;
pub use price_feed::PriceFeed;

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

    // (Removed legacy v1 mint endpoints)

    // (Token-2022 mint-to removed for now to reduce surface area)

    // Manual-price buy (enabled for initial on-chain event test)
    pub fn buy_asset_manual(
        ctx: Context<BuyAsset>,
        ticker: String,
        usdc_amount: u64,
        manual_price: u64,
    ) -> Result<()> {
        orders::buy_asset_manual(ctx, ticker, usdc_amount, manual_price)
    }

    // Manual-price sell (enabled for initial on-chain event test)
    pub fn sell_asset_manual(
        ctx: Context<SellAsset>,
        ticker: String,
        asset_amount: u64,
        manual_price: u64,
    ) -> Result<()> {
        orders::sell_asset_manual(ctx, ticker, asset_amount, manual_price)
    }

    // Initialize the OrderEvents PDA with full space to avoid realloc in pushes
    pub fn initialize_order_events(ctx: Context<InitializeOrderEvents>) -> Result<()> {
        let events = &mut ctx.accounts.order_events;
        events.buy_order_events = Vec::new();
        events.sell_order_events = Vec::new();
        events.bump = ctx.bumps.order_events;
        Ok(())
    }

    // View-like helper: read SPL token account balance and emit as event
    pub fn balance(ctx: Context<CheckTokenBalance>) -> Result<()> {
        permissionedToken::Balance(ctx)
    }

    // Burn tokens from a KYC-verified user (owner must sign)
    pub fn burn(
        ctx: Context<BurnFromKycUser>,
        amount: u64,
    ) -> Result<()> {
        permissionedToken::burn(ctx, amount)
    }

    // Token-2022: mint to KYC user using PDA authority (PermanentDelegate)
    pub fn mint(
        ctx: Context<MintToKycUser>,
        recipient: Pubkey,
        amount: u64,
    ) -> Result<()> {
        permissionedToken::mint(ctx, recipient, amount)
    }

    // Token-2022: transfer tokens only if recipient passes SAS KYC
    pub fn force_transfer(
        ctx: Context<ForceTransferChecked>,
        from_owner: Pubkey,
        to_recipient: Pubkey,
        amount: u64,
    ) -> Result<()> {
        permissionedToken::forceTranfer(ctx, from_owner, to_recipient, amount)
    }

    // Alias: force transfer by authority (issuer) -> same as transfer_kyc_checked_2022
    pub fn force_transfer_2022(
        ctx: Context<ForceTransferChecked>,
        from_owner: Pubkey,
        to_recipient: Pubkey,
        amount: u64,
    ) -> Result<()> {
        permissionedToken::forceTranfer(ctx, from_owner, to_recipient, amount)
    }

    // User-initiated transfer (sender signs). Both sender and recipient must be KYC attested.
    pub fn permissioned_transfer(
        ctx: Context<UserTransfer>,
        amount: u64,
    ) -> Result<()> {
        permissionedToken::permissionedTransfer(ctx, amount)
    }

    // Initialize a program-owned price feed (authority = config.authority)
    pub fn initialize_price_feed(ctx: Context<price_feed::InitializePriceFeed>) -> Result<()> {
        price_feed::initialize_price_feed(ctx)
    }

    // Update price feed (only config.authority)
    pub fn update_price(
        ctx: Context<price_feed::UpdatePrice>,
        price: u64,
        confidence: u64,
        expo: i32,
    ) -> Result<()> {
        price_feed::update_price(ctx, price, confidence, expo)
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
#[derive(Accounts)]
pub struct InitializeOrderEvents<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        space = orders::OrderEvents::SPACE,
        seeds = [orders::OrderEvents::SEED],
        bump,
    )]
    pub order_events: Account<'info, orders::OrderEvents>,
    pub system_program: Program<'info, System>,
}

// Removed legacy Initialize/CreateAsset/VerifyKyc account structs

// (Removed legacy v1 mint account structs)

// (MintToKycUser2022 removed for now)

// Event for checking balances
#[event]
pub struct TokenBalanceChecked {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
}

// Order account structures
#[derive(Accounts)]
pub struct BuyAsset<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// CHECK: Not used in manual path
    #[account(mut)]
    pub user_usdc_account: UncheckedAccount<'info>,
    
    /// CHECK: Not used in manual path; no init to avoid realloc
    #[account(mut)]
    pub order_events: UncheckedAccount<'info>,
    
    /// CHECK: Not used in manual path
    #[account(mut)]
    pub orders_usdc_account: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"orders_authority"],
        bump,
    )]
    /// CHECK: This is a program-derived authority for orders
    pub orders_authority: UncheckedAccount<'info>,
    
    /// CHECK: USDC mint (unused in manual path)
    pub usdc_mint: UncheckedAccount<'info>,
    
    /// CHECK: SAS attestation account
    pub attestation_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS schema account
    pub schema_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS credential account
    pub credential_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS program
    #[account(address = sas_integration::SAS_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub sas_program: UncheckedAccount<'info>,
    
    /// CHECK: Pyth price feed account
    pub price_feed: Account<'info, crate::price_feed::PriceFeed>,
    
    /// CHECK: Unused in manual path
    pub token_program: UncheckedAccount<'info>,
    /// CHECK: Unused in manual path
    pub associated_token_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SellAsset<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    /// CHECK: Not used in manual path
    #[account(mut)]
    pub user_usdc_account: UncheckedAccount<'info>,
    
    /// CHECK: Not used in manual path; no init to avoid realloc
    #[account(mut)]
    pub order_events: UncheckedAccount<'info>,
    
    /// CHECK: Not used in manual path
    #[account(mut)]
    pub orders_usdc_account: UncheckedAccount<'info>,
    
    #[account(
        seeds = [b"orders_authority"],
        bump,
    )]
    /// CHECK: This is a program-derived authority for orders
    pub orders_authority: UncheckedAccount<'info>,
    
    /// CHECK: USDC mint (unused in manual path)
    pub usdc_mint: UncheckedAccount<'info>,
    
    /// CHECK: SAS attestation account
    pub attestation_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS schema account
    pub schema_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS credential account
    pub credential_account: UncheckedAccount<'info>,
    
    /// CHECK: SAS program
    #[account(address = sas_integration::SAS_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub sas_program: UncheckedAccount<'info>,
    
    /// CHECK: Pyth price feed account
    pub price_feed: Account<'info, crate::price_feed::PriceFeed>,
    
    /// CHECK: Unused in manual path
    pub token_program: UncheckedAccount<'info>,
    /// CHECK: Unused in manual path
    pub associated_token_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

// Accounts for balance checking
#[derive(Accounts)]
pub struct CheckTokenBalance<'info> {
    pub token_program: Program<'info, Token>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
}

// Accounts for burning tokens from a KYC-verified user
#[derive(Accounts)]
pub struct BurnFromKycUser<'info> {
    #[account(mut)]
    pub mint: InterfaceAccount<'info, MintInterface>,

    // Owner of the token account (not required to sign when burning via delegate)
    /// CHECK: Owner public key for ATA derivation; not required to sign
    pub owner: UncheckedAccount<'info>,

    #[account(mut)]
    pub owner_token_account: InterfaceAccount<'info, TokenAccountInterface>,

    // The authorized issuer who must approve burn operations
    #[account(mut)]
    pub issuer: Signer<'info>,

    // Config holding the expected authority
    #[account(
        seeds = [crate::state::Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, crate::state::Config>,

    // Program authority PDA used as token delegate to authorize burns
    #[account(
        seeds = [b"program_authority", mint.key().as_ref()],
        bump,
    )]
    /// CHECK: Program-derived authority; signs via seeds
    pub program_authority: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}

// (InitializeKycMint2022 removed; mint is created off-chain)

// Token-2022: Accounts for minting to a KYC-verified user
#[derive(Accounts)]
pub struct MintToKycUser<'info> {
    #[account(mut)]
    pub mint: InterfaceAccount<'info, MintInterface>,

    #[account(mut)]
    pub recipient_token_account: InterfaceAccount<'info, TokenAccountInterface>,

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

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

// Token-2022: Accounts for KYC-checked transfer using PDA as PermanentDelegate
#[derive(Accounts)]
pub struct ForceTransferChecked<'info> {
    #[account(mut)]
    pub mint: InterfaceAccount<'info, MintInterface>,

    /// CHECK: From wallet (owner of source token account); not required to sign
    pub from_owner: UncheckedAccount<'info>,

    #[account(mut)]
    pub from_token_account: InterfaceAccount<'info, TokenAccountInterface>,

    /// CHECK: To wallet (recipient)
    pub to_recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub to_token_account: InterfaceAccount<'info, TokenAccountInterface>,

    /// CHECK: SAS attestation for recipient
    pub attestation_account: UncheckedAccount<'info>,
    /// CHECK: SAS schema
    pub schema_account: UncheckedAccount<'info>,
    /// CHECK: SAS credential
    pub credential_account: UncheckedAccount<'info>,
    /// CHECK: SAS program
    #[account(address = sas_integration::SAS_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub sas_program: UncheckedAccount<'info>,

    #[account(
        seeds = [b"program_authority", mint.key().as_ref()],
        bump,
    )]
    /// CHECK: Program-derived authority (PermanentDelegate)
    pub program_authority: UncheckedAccount<'info>,

    /// Issuer must authorize transfers
    #[account(mut)]
    pub issuer: Signer<'info>,

    // Config holding the expected authority
    #[account(
        seeds = [crate::state::Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, crate::state::Config>,

    pub token_program: Interface<'info, TokenInterface>,
}

// Token-2022: User-initiated transfer; both sides must be attested; sender signs
#[derive(Accounts)]
pub struct UserTransfer<'info> {
    #[account(mut)]
    pub mint: InterfaceAccount<'info, MintInterface>,

    // Sender must sign
    #[account(mut)]
    pub from_owner: Signer<'info>,

    #[account(mut)]
    pub from_token_account: InterfaceAccount<'info, TokenAccountInterface>,

    /// CHECK: Recipient wallet
    pub to_recipient: UncheckedAccount<'info>,

    #[account(mut)]
    pub to_token_account: InterfaceAccount<'info, TokenAccountInterface>,

    /// CHECK: SAS attestation for sender
    pub sender_attestation_account: UncheckedAccount<'info>,
    /// CHECK: SAS attestation for recipient
    pub recipient_attestation_account: UncheckedAccount<'info>,
    /// CHECK: SAS schema
    pub schema_account: UncheckedAccount<'info>,
    /// CHECK: SAS credential
    pub credential_account: UncheckedAccount<'info>,
    /// CHECK: SAS program
    #[account(address = sas_integration::SAS_PROGRAM_ID.parse::<Pubkey>().unwrap())]
    pub sas_program: UncheckedAccount<'info>,

    pub token_program: Interface<'info, TokenInterface>,
}
