// CHANGE: Translate context documentation to English for the localization task.
// WHY: Anchor context files define public invariants that must be readable without Russian text.
// QUOTE(TZ): "Replace all Russian with English"
// REF: USER-TRANSLATE
// SOURCE: n/a
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::contract::{
    constants::*,
    state::{Pool, Property, UserReward, Vault},
};

// CHANGE: Group Anchor context structs to improve modularity and clarity.
// WHY: Separating account validation rules from instruction logic aids maintainability.
// QUOTE(TZ): "implement at least some architecture"
// REF: USER-RENAME
// SOURCE: n/a
#[derive(Accounts)]
#[instruction(property_id: String)]
pub struct InitProperty<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Property::INIT_SPACE,
        seeds = [PROPERTY_SEED, property_id.as_bytes()],
        bump
    )]
    pub property: Account<'info, Property>,
    #[account(
        init,
        payer = authority,
        space = Vault::INIT_SPACE,
        seeds = [VAULT_SEED, property.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        init,
        payer = authority,
        space = Pool::INIT_SPACE,
        seeds = [POOL_SEED, property.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = vault,
        mint::freeze_authority = vault,
        seeds = [MINT_SEED, property.key().as_ref()],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    /// CHECK: Metadata PDA validated in handler using Metaplex seeds.
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: Metaplex Token Metadata program id enforced during CPI.
    pub token_metadata_program: UncheckedAccount<'info>,
    /// CHECK: ATA is created within init_property; future instructions validate stored key.
    #[account(mut)]
    pub vault_shares_ata: UncheckedAccount<'info>,
    /// CHECK: Vault USDC ATA is instantiated deterministically and persisted in Vault state.
    #[account(mut)]
    pub vault_usdc_ata: UncheckedAccount<'info>,
    /// CHECK: Pool USDC ATA address is stored on the Pool account and re-validated before use.
    #[account(mut)]
    pub pool_usdc_ata: UncheckedAccount<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct InitMetadata<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub property: Account<'info, Property>,
    #[account(
        mut,
        has_one = property,
        has_one = mint,
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: validated against PDA seeds inside handler
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    /// CHECK: program id enforced at runtime
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyShares<'info> {
    #[account(mut, has_one = mint)]
    pub property: Account<'info, Property>,
    #[account(
        mut,
        has_one = property,
        has_one = mint,
        has_one = usdc_mint,
        constraint = vault.vault_shares_ata == vault_shares_ata.key(),
        constraint = vault.vault_usdc_ata == vault_usdc_ata.key(),
    )]
    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub vault_shares_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_usdc_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        constraint = user_usdc_ata.owner == user.key(),
        constraint = user_usdc_ata.mint == vault.usdc_mint,
    )]
    pub user_usdc_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        constraint = user_shares_ata.owner == user.key(),
        constraint = user_shares_ata.mint == property.mint,
    )]
    pub user_shares_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct DepositYield<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(has_one = authority)]
    pub property: Account<'info, Property>,
    #[account(
        mut,
        has_one = property,
        has_one = usdc_mint,
        has_one = mint,
        constraint = pool.pool_usdc_ata == pool_usdc_ata.key(),
    )]
    pub pool: Account<'info, Pool>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub authority_usdc_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_usdc_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub property: Account<'info, Property>,
    #[account(
        mut,
        has_one = property,
        has_one = mint,
        has_one = usdc_mint,
        constraint = pool.pool_usdc_ata == pool_usdc_ata.key(),
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        init_if_needed,
        payer = user,
        space = UserReward::INIT_SPACE,
        seeds = [USER_REWARD_SEED, pool.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub user_reward: Account<'info, UserReward>,
    #[account(mut)]
    pub user_shares_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_usdc_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub pool_usdc_ata: InterfaceAccount<'info, TokenAccount>,
    pub mint: InterfaceAccount<'info, Mint>,
    pub usdc_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateMetadata<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub property: Account<'info, Property>,
}

#[derive(Accounts)]
pub struct CloseProperty<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub property: Account<'info, Property>,
}
