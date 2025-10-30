use anchor_lang::prelude::*;

#[account]
pub struct PriceFeed {
    pub price: u64,       // price as positive integer
    pub confidence: u64,  // confidence interval as positive integer
    pub expo: i32,        // exponent (e.g., -6 for 6 decimals)
    pub timestamp: i64,   // unix seconds
    pub bump: u8,
}

impl PriceFeed {
    pub const SEED: &'static [u8] = b"price_feed";
    pub const SPACE: usize = 8 + 8 + 8 + 4 + 8 + 1; // discr + fields
}

pub fn initialize_price_feed(ctx: Context<InitializePriceFeed>) -> Result<()> {
    let feed = &mut ctx.accounts.price_feed;
    feed.price = 0;
    feed.confidence = 0;
    feed.expo = -6; // default to 6 decimals for USDC standard
    feed.timestamp = Clock::get()?.unix_timestamp;
    feed.bump = ctx.bumps.price_feed;
    Ok(())
}

pub fn update_price(ctx: Context<UpdatePrice>, price: u64, confidence: u64, expo: i32) -> Result<()> {
    // Only config.authority can push updates
    require_keys_eq!(
        ctx.accounts.config.authority,
        ctx.accounts.authority.key(),
        crate::errors::ErrorCode::Unauthorized
    );

    let feed = &mut ctx.accounts.price_feed;
    feed.price = price;
    feed.confidence = confidence;
    feed.expo = expo;
    feed.timestamp = Clock::get()?.unix_timestamp;
    Ok(())
}

#[derive(Accounts)]
pub struct InitializePriceFeed<'info> {
    #[account(
        init,
        payer = payer,
        space = PriceFeed::SPACE,
        seeds = [PriceFeed::SEED],
        bump,
    )]
    pub price_feed: Account<'info, PriceFeed>,

    #[account(
        seeds = [crate::state::Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, crate::state::Config>,

    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(mut,
        seeds = [PriceFeed::SEED],
        bump = price_feed.bump,
    )]
    pub price_feed: Account<'info, PriceFeed>,

    #[account(
        seeds = [crate::state::Config::SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, crate::state::Config>,

    pub authority: Signer<'info>,
}


