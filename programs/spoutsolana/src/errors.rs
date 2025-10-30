use anchor_lang::prelude::*;

// Describes error codes that can be returned by the program
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")] 
    Unauthorized,
    #[msg("KYC verification failed")] 
    KycVerificationFailed,
    #[msg("Invalid price feed")] 
    InvalidPriceFeed,
}


