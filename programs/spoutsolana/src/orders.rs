use anchor_lang::prelude::*;
use anchor_spl::{
    token::{transfer, Transfer},
};
use crate::sas_integration;
use crate::{sas_integration::*, errors::ErrorCode};
use std::str::FromStr;
// use pyth_sdk_solana::load_price_feed_from_account_info;

// Order types
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum OrderType {
    Buy,
    Sell,
}

// Order status
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum OrderStatus {
    Pending,
    Filled,
    Cancelled,
}

// Order structure
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct Order {
    pub user: Pubkey,
    pub ticker: String,
    pub order_type: OrderType,
    pub usdc_amount: u64,
    pub asset_amount: u64,
    pub price: u64,
    pub oracle_timestamp: i64,
    pub status: OrderStatus,
    pub created_at: i64,
}

// Order events account
#[account]
pub struct OrderEvents {
    pub buy_order_events: Vec<Order>,
    pub sell_order_events: Vec<Order>,
    pub bump: u8,
}

impl OrderEvents {
    pub const SEED: &'static [u8] = b"order_events";
    pub const SPACE: usize = 8 + // discriminator
        4 + (1000 * 200) + // buy_order_events (max 1000 orders, ~200 bytes each)
        4 + (1000 * 200) + // sell_order_events (max 1000 orders, ~200 bytes each)
        1; // bump, which is incremented till 1 bytes (0 to 255) and checked if PDA matches
}

// Single Pyth Price Feed ID (LQD on Solana)
pub const PYTH_LQD_FEED: &str = "EUShAPT8QRmBnEicmHtUqXqQxg4X5yn5fEShwjMPACzf";

// Oracle price structure
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct OraclePrice {
    pub price: u64,
    pub timestamp: i64,
    pub confidence: u64,
    pub expo: i32,
}

// Get LQD price feed ID
pub fn get_lqd_price_feed_id() -> Result<Pubkey> {
    Pubkey::from_str(PYTH_LQD_FEED).map_err(|_| ErrorCode::InvalidPriceFeed.into())
}

// Mock Pyth price parsing (temporarily using mock data)
pub fn get_pyth_price(
    price_feed_account: &AccountInfo,
) -> Result<OraclePrice> {
    // Ensure account has data
    if price_feed_account.data_is_empty() {
        return Err(ErrorCode::InvalidPriceFeed.into());
    }
    
    // Mock implementation for testing - replace with real Pyth parsing later
    let (price, expo, confidence, timestamp) = (100 * 10_u64.pow(6), -6, 10 * 10_u64.pow(6), Clock::get()?.unix_timestamp);
    
    Ok(OraclePrice {
        price,
        timestamp,
        confidence,
        expo,
    })
}

// Helper function to get oracle price (now using Pyth)
pub fn get_oracle_price(
    price_feed_account: &AccountInfo,
) -> Result<(u64, i64)> {
    let oracle_price = get_pyth_price(price_feed_account)?;
    
    // Convert price to 6 decimal places (USDC standard)
    let price_with_decimals = if oracle_price.expo < 0 {
        oracle_price.price / 10_u64.pow((-oracle_price.expo) as u32)
    } else {
        oracle_price.price * 10_u64.pow(oracle_price.expo as u32)
    };
    
    Ok((price_with_decimals, oracle_price.timestamp))
}

// Verify KYC status against SAS by PDA and owner checks
pub fn verify_kyc_status(
    user: &Pubkey,
    attestation_account: &AccountInfo,
    credential_account: &AccountInfo,
    schema_account: &AccountInfo,
) -> Result<bool> {
    if attestation_account.data_is_empty() {
        msg!("Attestation account is empty");
        return Ok(false);
    }
    
    // Enforce SAS program owns the attestation account
    let sas_program = Pubkey::from_str(sas_integration::SAS_PROGRAM_ID).map_err(|_| ErrorCode::KycVerificationFailed)?;
    if attestation_account.owner != &sas_program {
        msg!("Attestation not owned by SAS program");
        return Ok(false);
    }
    
    // Derive expected PDA using SAS seeds: credential + schema + nonce(user)
    let (expected_pda, _) = sas_integration::derive_attestation_pda(
        &credential_account.key(),
        &schema_account.key(),
        user,
    );
    
    if attestation_account.key() != expected_pda {
        msg!("Attestation PDA mismatch. Expected {}", expected_pda);
        return Ok(false);
    }
    
    Ok(true)
}


// Buy asset instruction
pub fn buy_asset(
    ctx: Context<crate::BuyAsset>,
    ticker: String,
    usdc_amount: u64,
) -> Result<()> {
    // Verify KYC status
    let is_verified = verify_kyc_status(
        &ctx.accounts.user.key(),
        &ctx.accounts.attestation_account,
        &ctx.accounts.credential_account,
        &ctx.accounts.schema_account,
    )?;
    
    require!(is_verified, ErrorCode::KycVerificationFailed);
    
    // Get price from on-chain PriceFeed PDA
    let feed = &ctx.accounts.price_feed;
    let price = if feed.expo < 0 {
        feed.price / 10_u64.pow((-feed.expo) as u32)
    } else {
        feed.price * 10_u64.pow(feed.expo as u32)
    };
    let oracle_ts = feed.timestamp;
    
    // Calculate asset amount (with proper decimal handling)
    let decimals = 10_u64.pow(6); // USDC has 6 decimals
    let asset_amount = (usdc_amount * decimals) / price;
    
    // Transfer USDC from user to orders contract
    let transfer_instruction = Transfer {
        from: ctx.accounts.user_usdc_account.to_account_info(),
        to: ctx.accounts.orders_usdc_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, transfer_instruction);
    transfer(cpi_ctx, usdc_amount)?;
    
    // Create order
    let order = Order {
        user: ctx.accounts.user.key(),
        ticker: ticker.clone(),
        order_type: OrderType::Buy,
        usdc_amount,
        asset_amount,
        price,
        oracle_timestamp: oracle_ts,
        status: OrderStatus::Pending,
        created_at: Clock::get()?.unix_timestamp,
    };
    
    // Skip persisting to events storage for this smoke test
    
    // Emit event
    emit!(BuyOrderCreated {
        user: ctx.accounts.user.key(),
        ticker,
        usdc_amount,
        asset_amount,
        price,
        oracle_timestamp: oracle_ts,
    });
    
    Ok(())
}

// Sell asset instruction
pub fn sell_asset(
    ctx: Context<crate::SellAsset>,
    ticker: String,
    asset_amount: u64,
) -> Result<()> {
    // Verify KYC status
    let is_verified = verify_kyc_status(
        &ctx.accounts.user.key(),
        &ctx.accounts.attestation_account,
        &ctx.accounts.credential_account,
        &ctx.accounts.schema_account,
    )?;
    
    require!(is_verified, ErrorCode::KycVerificationFailed);
    
    // Get price from on-chain PriceFeed PDA
    let feed = &ctx.accounts.price_feed;
    let price = if feed.expo < 0 {
        feed.price / 10_u64.pow((-feed.expo) as u32)
    } else {
        feed.price * 10_u64.pow(feed.expo as u32)
    };
    let oracle_ts = feed.timestamp;
    
    // Calculate USDC amount
    let decimals = 10_u64.pow(6); // USDC has 6 decimals
    let usdc_amount = (asset_amount * price) / decimals;
    
    // Transfer USDC from orders contract to user
    let transfer_instruction = Transfer {
        from: ctx.accounts.orders_usdc_account.to_account_info(),
        to: ctx.accounts.user_usdc_account.to_account_info(),
        authority: ctx.accounts.orders_authority.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let bump_seed = [ctx.bumps.orders_authority];
    let seeds: &[&[u8]] = &[b"orders_authority", &bump_seed];
    let signer_seeds = &[seeds];
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, transfer_instruction, signer_seeds);
    transfer(cpi_ctx, usdc_amount)?;
    
    // Create order
    let order = Order {
        user: ctx.accounts.user.key(),
        ticker: ticker.clone(),
        order_type: OrderType::Sell,
        usdc_amount,
        asset_amount,
        price,
        oracle_timestamp: oracle_ts,
        status: OrderStatus::Pending,
        created_at: Clock::get()?.unix_timestamp,
    };

    // Skip persisting to events storage for this smoke test
    
    // Emit event
    emit!(SellOrderCreated {
        user: ctx.accounts.user.key(),
        ticker,
        usdc_amount,
        asset_amount,
        price,
        oracle_timestamp: oracle_ts,
    });
    
    Ok(())
}

// Buy asset instruction (manual price, for testing/non-oracle flows)
pub fn buy_asset_manual(
    ctx: Context<crate::BuyAsset>,
    ticker: String,
    usdc_amount: u64,
    manual_price: u64,
) -> Result<()> {
    // Verify KYC status using SAS attestation
    let is_verified = verify_kyc_status(
        &ctx.accounts.user.key(),
        &ctx.accounts.attestation_account,
        &ctx.accounts.credential_account,
        &ctx.accounts.schema_account,
    )?;
    require!(is_verified, ErrorCode::KycVerificationFailed);

    let price = manual_price; // already expected in 6 decimals (USDC standard)
    let oracle_ts = Clock::get()?.unix_timestamp;

    // Calculate asset amount
    let decimals = 10_u64.pow(6);
    let asset_amount = (usdc_amount * decimals) / price;

    // Transfer USDC from user to orders contract (same as buy_asset)
    let transfer_instruction = Transfer {
        from: ctx.accounts.user_usdc_account.to_account_info(),
        to: ctx.accounts.orders_usdc_account.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, transfer_instruction);
    transfer(cpi_ctx, usdc_amount)?;

    // Create order
    let order = Order {
        user: ctx.accounts.user.key(),
        ticker: ticker.clone(),
        order_type: OrderType::Buy,
        usdc_amount,
        asset_amount,
        price,
        oracle_timestamp: oracle_ts,
        status: OrderStatus::Pending,
        created_at: Clock::get()?.unix_timestamp,
    };

    // Skip persisting to events storage for this smoke test

    // Emit event
    emit!(BuyOrderCreated {
        user: ctx.accounts.user.key(),
        ticker,
        usdc_amount,
        asset_amount,
        price,
        oracle_timestamp: oracle_ts,
    });

    Ok(())
}

// Sell asset instruction (manual price, for testing/non-oracle flows)
pub fn sell_asset_manual(
    ctx: Context<crate::SellAsset>,
    ticker: String,
    asset_amount: u64,
    manual_price: u64,
) -> Result<()> {
    // Verify KYC status using SAS attestation (same as buy)
    let is_verified = verify_kyc_status(
        &ctx.accounts.user.key(),
        &ctx.accounts.attestation_account,
        &ctx.accounts.credential_account,
        &ctx.accounts.schema_account,
    )?;
    require!(is_verified, ErrorCode::KycVerificationFailed);

    let price = manual_price; // expected in 6 decimals (USDC standard)
    let oracle_ts = Clock::get()?.unix_timestamp;

    // Calculate USDC amount
    let decimals = 10_u64.pow(6);
    let usdc_amount = (asset_amount * price) / decimals;

    // Create order
    let order = Order {
        user: ctx.accounts.user.key(),
        ticker: ticker.clone(),
        order_type: OrderType::Sell,
        usdc_amount,
        asset_amount,
        price,
        oracle_timestamp: oracle_ts,
        status: OrderStatus::Pending,
        created_at: Clock::get()?.unix_timestamp,
    };

    // Skip persisting to events storage for this smoke test
    
    // Emit event
    emit!(SellOrderCreated {
        user: ctx.accounts.user.key(),
        ticker,
        usdc_amount,
        asset_amount,
        price,
        oracle_timestamp: oracle_ts,
    });
    
    Ok(())
}

// Events
#[event]
pub struct BuyOrderCreated {
    pub user: Pubkey,
    pub ticker: String,
    pub usdc_amount: u64,
    pub asset_amount: u64,
    pub price: u64,
    pub oracle_timestamp: i64,
}

#[event]
pub struct SellOrderCreated {
    pub user: Pubkey,
    pub ticker: String,
    pub usdc_amount: u64,
    pub asset_amount: u64,
    pub price: u64,
    pub oracle_timestamp: i64,
}
