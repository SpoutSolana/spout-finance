use anchor_lang::prelude::*;

use crate::state::{Config, InitializeArgs};

pub fn handler(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.authority = args.authority;
    config.bump = ctx.bumps.config;
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 1,
        seeds = [Config::SEED],
        bump
    )]
    pub config: Account<'info, Config>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}


