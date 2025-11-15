use anchor_lang::prelude::*;

use super::constants::MAX_METADATA_URI_LEN;

// CHANGE: Housing Anchor account structs under contract module for better architecture boundaries.
// WHY: Dedicated folder clarifies where account layouts/config reside.
// QUOTE(TЗ): "конфиг ... в отдельной папке"
// REF: USER-ARCH
// SOURCE: n/a
#[account]
pub struct Property {
    pub mint: Pubkey,
    pub total_shares: u64,
    pub metadata_uri: String,
    pub authority: Pubkey,
    pub active: bool,
}

impl Property {
    pub const INIT_SPACE: usize = 8 + 32 + 8 + (4 + MAX_METADATA_URI_LEN) + 32 + 1;
}

#[account]
pub struct Vault {
    pub property: Pubkey,
    pub mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub vault_shares_ata: Pubkey,
    pub vault_usdc_ata: Pubkey,
    pub price_per_share: u64,
}

impl Vault {
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 32 + 32 + 32 + 8;
}

#[account]
pub struct Pool {
    pub property: Pubkey,
    pub mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub pool_usdc_ata: Pubkey,
    pub acc_per_share: u128,
}

impl Pool {
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 32 + 32 + 16;
}

#[account]
pub struct UserReward {
    pub pool: Pubkey,
    pub owner: Pubkey,
    pub paid_per_share: u128,
}

impl UserReward {
    pub const INIT_SPACE: usize = 8 + 32 + 32 + 16;
}
