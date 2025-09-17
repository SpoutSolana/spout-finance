use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")] 
    Unauthorized,
    #[msg("Name too long")] 
    NameTooLong,
    #[msg("Symbol too long")] 
    SymbolTooLong,
    #[msg("Schema ID too long")] 
    SchemaIdTooLong,
    #[msg("KYC verification failed")] 
    KycVerificationFailed,
    #[msg("KYC required but not provided")] 
    KycRequired,
}


