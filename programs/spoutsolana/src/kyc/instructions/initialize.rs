use anchor_lang::prelude::*;
use crate::state::InitializeArgs;
use super::super::super::Initialize;

pub fn handler(ctx: Context<Initialize>, args: InitializeArgs) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.authority = args.authority;
    config.sas_program = args.sas_program;
    config.bump = ctx.bumps.config;
    Ok(())
}



