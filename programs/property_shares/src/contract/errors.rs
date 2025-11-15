use anchor_lang::prelude::*;

// CHANGE: Relocate error catalog to contract namespace for clarity.
// WHY: Users requested a dedicated contract folder for configs/invariants.
// QUOTE(TЗ): "конфиг ... папка ... контракт"
// REF: USER-ARCH
// SOURCE: n/a
#[error_code]
pub enum ErrorCode {
    #[msg("Property identifier too long")]
    PropertyIdTooLong,
    #[msg("Metadata URI too long")]
    MetadataUriTooLong,
    #[msg("Total shares must be greater than zero")]
    ZeroTotalShares,
    #[msg("Amount must be greater than zero")]
    ZeroAmount,
    #[msg("Property is inactive")]
    PropertyInactive,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Vault PDA mismatch")]
    InvalidVault,
    #[msg("Pool PDA mismatch")]
    InvalidPool,
    #[msg("Unauthorized caller")]
    Unauthorized,
    #[msg("No rewards available to claim")]
    NoRewardsAvailable,
    #[msg("Reward calculation underflow")]
    RewardUnderflow,
    #[msg("User reward PDA does not match caller or pool")]
    RewardAccountMismatch,
}
