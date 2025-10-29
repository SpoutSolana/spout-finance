use anchor_lang::prelude::*;

// Describes error codes that can be returned by the program
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
    #[msg("Schema does not match asset's configured KYC schema")] 
    SchemaMismatch,
    #[msg("Credential has been revoked")] 
    CredentialRevoked,
    #[msg("Credential has expired")] 
    CredentialExpired,
    #[msg("Credential holder does not match expected holder")] 
    HolderMismatch,
    #[msg("Invalid credential data")] 
    InvalidCredentialData,
    #[msg("Account not initialized")] 
    AccountNotInitialized,
    #[msg("Invalid ticker")] 
    InvalidTicker,
    #[msg("Invalid price feed")] 
    InvalidPriceFeed,
    #[msg("Price not found")] 
    PriceNotFound,
    #[msg("Stale price")] 
    StalePrice,
    #[msg("Low confidence price")] 
    LowConfidencePrice,
}


