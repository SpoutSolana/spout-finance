use anchor_lang::prelude::*;

use crate::errors::ErrorCode;
use crate::state::{Config, SasCredential, SasSchema};

// SAS credential verification helper
// This function verifies that a holder has a valid KYC credential from the SAS program
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

    // Verify that both credential and schema accounts are owned by the SAS program
    require_keys_eq!(*credential.owner, config.sas_program, ErrorCode::KycVerificationFailed);
    require_keys_eq!(*schema.owner, config.sas_program, ErrorCode::KycVerificationFailed);

    // Derive expected credential PDA using SAS standard seeds
    let (expected_credential_pda, _bump) = Pubkey::find_program_address(
        &[SasCredential::SEED_PREFIX, holder.key().as_ref(), schema_id.as_bytes()], 
        &config.sas_program
    );
    require_keys_eq!(credential.key(), expected_credential_pda, ErrorCode::KycVerificationFailed);

    // Derive expected schema PDA using SAS standard seeds
    let (expected_schema_pda, _bump) = Pubkey::find_program_address(
        &[SasSchema::SEED_PREFIX, schema_id.as_bytes()], 
        &config.sas_program
    );
    require_keys_eq!(schema.key(), expected_schema_pda, ErrorCode::KycVerificationFailed);

    // TODO: Add CPI call to SAS program for additional verification if SAS provides a verify instruction
    // This would involve calling the SAS program's verify instruction via CPI
    
    // TODO: Deserialize credential data and check:
    // - Credential is not expired
    // - Credential is not revoked
    // - Credential is valid for the specified schema
    // - Holder matches the credential subject

    Ok(())
}

// Helper function to derive SAS credential PDA
pub fn derive_sas_credential_pda(
    sas_program: &Pubkey,
    holder: &Pubkey,
    schema_id: &str,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[SasCredential::SEED_PREFIX, holder.as_ref(), schema_id.as_bytes()],
        sas_program,
    )
}

// Helper function to derive SAS schema PDA
pub fn derive_sas_schema_pda(
    sas_program: &Pubkey,
    schema_id: &str,
) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[SasSchema::SEED_PREFIX, schema_id.as_bytes()],
        sas_program,
    )
}


