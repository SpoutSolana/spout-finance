use anchor_lang::prelude::*;

use crate::errors::ErrorCode;
use crate::state::{Config};

// Placeholder SAS PDA derivations until SAS docs are wired.
// Keep this helper encapsulated so we can swap in official seeds/layout and CPI easily.
pub fn assert_holder_is_kyc_verified<'info>(
    config: &Account<'info, Config>,
    sas_program: &AccountInfo<'info>,
    holder: &AccountInfo<'info>,
    schema_id: &str,
    credential: &AccountInfo<'info>,
    schema: &AccountInfo<'info>,
) -> Result<()> {
    // Ensure we are checking against the configured SAS program
    require_keys_eq!(sas_program.key(), config.sas_program, ErrorCode::Unauthorized);

    // TODO: Replace with SAS-documented PDA seeds and verification CPI.
    // For now, enforce ownership by SAS and basic schema match left to caller.
    require_keys_eq!(*credential.owner, config.sas_program, ErrorCode::KycVerificationFailed);
    require_keys_eq!(*schema.owner, config.sas_program, ErrorCode::KycVerificationFailed);

    // In the real implementation, derive credential PDA like:
    // let (expected_cred, _bump) = Pubkey::find_program_address(
    //     &[b"credential", holder.key.as_ref(), schema_id.as_bytes()], &config.sas_program);
    // require_keys_eq!(credential.key(), expected_cred, ErrorCode::KycVerificationFailed);
    // Then deserialize credential data per SAS layout and check validity, expiry, revocation.

    // Optionally: call SAS CPI verify if provided by SAS API.

    Ok(())
}


