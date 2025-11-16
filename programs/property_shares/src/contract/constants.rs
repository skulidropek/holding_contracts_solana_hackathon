// CHANGE: Translate contract constant documentation to English to satisfy localization.
// WHY: Shared invariants should be readable in a single language across the repo.
// QUOTE(TZ): "Replace all Russian with English"
// REF: USER-TRANSLATE
// SOURCE: n/a
// CHANGE: Store protocol-wide constants/seeds inside dedicated contract namespace.
// WHY: Satisfies request for clear configuration folder under `programs/property_shares`.
// QUOTE(TZ): "store config inside a dedicated folder ... the folder will be called contract"
// REF: USER-ARCH
// SOURCE: n/a
pub const SCALE: u128 = 1_000_000_000_000;
pub const MAX_METADATA_URI_LEN: usize = 256;
pub const MAX_METADATA_NAME_LEN: usize = 64;
pub const MAX_METADATA_SYMBOL_LEN: usize = 16;
pub const MAX_PROPERTY_ID_LEN: usize = 32;
pub const PROPERTY_SEED: &[u8] = b"property";
pub const MINT_SEED: &[u8] = b"property_mint";
pub const METADATA_SEED: &[u8] = b"metadata";
pub const VAULT_SEED: &[u8] = b"vault";
pub const POOL_SEED: &[u8] = b"pool";
pub const USER_REWARD_SEED: &[u8] = b"user_reward";
