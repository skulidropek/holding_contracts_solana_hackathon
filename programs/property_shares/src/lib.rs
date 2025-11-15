use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token,
    metadata::{self, CreateMetadataAccountsV3},
    token_interface::{self, MintTo, Transfer},
};

use crate::{
    contexts::*,
    contract::{constants::*, errors::ErrorCode as ContractError},
};

pub mod contexts;
pub mod contract;

// ВСТАВЬ СЮДА program id ИЗ `anchor keys list`
declare_id!("Bvq9mwXmV95Mz848zK8FZ11JiKfLjGc7savK5u657H9Z");

#[program]
pub mod property_shares {
    use super::*;

    // CHANGE: init_property wires SPL mint/vault/pool using modular architecture.
    // WHY: Rebranded project requires clear initialization boundary per new architecture.
    // QUOTE(TЗ): "переиминовать проект ... И сделать хоть какую-то архитектуру"
    // REF: USER-RENAME
    // SOURCE: n/a
    pub fn init_property(
        ctx: Context<InitProperty>,
        property_id: String,
        total_shares: u64,
        metadata_name: String,
        metadata_symbol: String,
        metadata_uri: String,
        price_per_share: u64,
    ) -> Result<()> {
        require!(
            property_id.len() <= MAX_PROPERTY_ID_LEN,
            ContractError::PropertyIdTooLong
        );
        require!(
            metadata_name.len() <= MAX_METADATA_NAME_LEN,
            ContractError::MetadataNameTooLong
        );
        require!(
            metadata_symbol.len() <= MAX_METADATA_SYMBOL_LEN,
            ContractError::MetadataSymbolTooLong
        );
        require!(
            metadata_uri.len() <= MAX_METADATA_URI_LEN,
            ContractError::MetadataUriTooLong
        );
        require!(total_shares > 0, ContractError::ZeroTotalShares);

        {
            let property = &mut ctx.accounts.property;
            property.mint = ctx.accounts.mint.key();
            property.total_shares = total_shares;
            property.metadata_uri = metadata_uri;
            property.authority = ctx.accounts.authority.key();
            property.active = true;
        }

        {
            let vault = &mut ctx.accounts.vault;
            vault.property = ctx.accounts.property.key();
            vault.mint = ctx.accounts.property.mint;
            vault.usdc_mint = ctx.accounts.usdc_mint.key();
            vault.vault_shares_ata = ctx.accounts.vault_shares_ata.key();
            vault.vault_usdc_ata = ctx.accounts.vault_usdc_ata.key();
            vault.price_per_share = price_per_share;
        }

        {
            let pool = &mut ctx.accounts.pool;
            pool.property = ctx.accounts.property.key();
            pool.mint = ctx.accounts.property.mint;
            pool.usdc_mint = ctx.accounts.usdc_mint.key();
            pool.pool_usdc_ata = ctx.accounts.pool_usdc_ata.key();
            pool.acc_per_share = 0;
        }

        initialize_associated_accounts(&ctx)?;

        let property_key = ctx.accounts.property.key();
        let (expected_vault, vault_bump) =
            Pubkey::find_program_address(&[VAULT_SEED, property_key.as_ref()], &crate::ID);
        require_keys_eq!(
            ctx.accounts.vault.key(),
            expected_vault,
            ContractError::InvalidVault
        );

        let vault_bump_seed = [vault_bump];
        let vault_signer: &[&[u8]] = &[VAULT_SEED, property_key.as_ref(), &vault_bump_seed];
        let signer = &[vault_signer];

        let mint_to_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.vault_shares_ata.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let mint_to_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            mint_to_accounts,
            signer,
        );
        token_interface::mint_to(mint_to_ctx, total_shares)?;

        create_metadata(
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
            metadata_name,
            metadata_symbol,
            ctx.accounts.property.metadata_uri.clone(),
            signer,
        )?;

        Ok(())
    }

    pub fn buy_shares(ctx: Context<BuyShares>, amount_shares: u64) -> Result<()> {
        require!(amount_shares > 0, ContractError::ZeroAmount);
        let property = &ctx.accounts.property;
        require!(property.active, ContractError::PropertyInactive);

        let price = ctx.accounts.vault.price_per_share;
        let amount_usdc = amount_shares
            .checked_mul(price)
            .ok_or(ContractError::ArithmeticOverflow)?;

        let pay_accounts = Transfer {
            from: ctx.accounts.user_usdc_ata.to_account_info(),
            to: ctx.accounts.vault_usdc_ata.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let pay_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), pay_accounts);
        token_interface::transfer(pay_ctx, amount_usdc)?;

        let property_key = property.key();
        let (expected_vault, vault_bump) =
            Pubkey::find_program_address(&[VAULT_SEED, property_key.as_ref()], &crate::ID);
        require_keys_eq!(
            ctx.accounts.vault.key(),
            expected_vault,
            ContractError::InvalidVault
        );
        let vault_bump_seed = [vault_bump];
        let vault_signer: &[&[u8]] = &[VAULT_SEED, property_key.as_ref(), &vault_bump_seed];
        let signer = &[vault_signer];

        let share_accounts = Transfer {
            from: ctx.accounts.vault_shares_ata.to_account_info(),
            to: ctx.accounts.user_shares_ata.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let share_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            share_accounts,
            signer,
        );
        token_interface::transfer(share_ctx, amount_shares)?;

        Ok(())
    }

    pub fn deposit_yield(ctx: Context<DepositYield>, amount: u64) -> Result<()> {
        require!(amount > 0, ContractError::ZeroAmount);
        let property = &ctx.accounts.property;
        require!(property.active, ContractError::PropertyInactive);
        require_keys_eq!(
            ctx.accounts.authority.key(),
            property.authority,
            ContractError::Unauthorized
        );

        let deposit_accounts = Transfer {
            from: ctx.accounts.authority_usdc_ata.to_account_info(),
            to: ctx.accounts.pool_usdc_ata.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let deposit_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            deposit_accounts,
        );
        token_interface::transfer(deposit_ctx, amount)?;

        let scaled = (amount as u128)
            .checked_mul(SCALE)
            .ok_or(ContractError::ArithmeticOverflow)?;
        let per_share = scaled
            .checked_div(property.total_shares as u128)
            .ok_or(ContractError::ArithmeticOverflow)?;
        ctx.accounts.pool.acc_per_share = ctx
            .accounts
            .pool
            .acc_per_share
            .checked_add(per_share)
            .ok_or(ContractError::ArithmeticOverflow)?;

        Ok(())
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        if ctx.accounts.user_reward.pool == Pubkey::default() {
            ctx.accounts.user_reward.pool = ctx.accounts.pool.key();
            ctx.accounts.user_reward.owner = ctx.accounts.user.key();
        } else {
            require_keys_eq!(
                ctx.accounts.user_reward.pool,
                ctx.accounts.pool.key(),
                ContractError::RewardAccountMismatch
            );
            require_keys_eq!(
                ctx.accounts.user_reward.owner,
                ctx.accounts.user.key(),
                ContractError::RewardAccountMismatch
            );
        }

        let user_shares = ctx.accounts.user_shares_ata.amount;
        let pending_per_share = ctx
            .accounts
            .pool
            .acc_per_share
            .checked_sub(ctx.accounts.user_reward.paid_per_share)
            .ok_or(ContractError::RewardUnderflow)?;
        let to_pay = pending_per_share
            .checked_mul(user_shares as u128)
            .ok_or(ContractError::ArithmeticOverflow)?
            .checked_div(SCALE)
            .ok_or(ContractError::ArithmeticOverflow)?;
        require!(to_pay > 0, ContractError::NoRewardsAvailable);

        ctx.accounts.user_reward.paid_per_share = ctx.accounts.pool.acc_per_share;

        let property_key = ctx.accounts.property.key();
        let (expected_pool, pool_bump) =
            Pubkey::find_program_address(&[POOL_SEED, property_key.as_ref()], &crate::ID);
        require_keys_eq!(
            ctx.accounts.pool.key(),
            expected_pool,
            ContractError::InvalidPool
        );
        let pool_bump_seed = [pool_bump];
        let pool_signer: &[&[u8]] = &[POOL_SEED, property_key.as_ref(), &pool_bump_seed];
        let signer = &[pool_signer];

        let payout_accounts = Transfer {
            from: ctx.accounts.pool_usdc_ata.to_account_info(),
            to: ctx.accounts.user_usdc_ata.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        };
        let payout_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            payout_accounts,
            signer,
        );
        token_interface::transfer(
            payout_ctx,
            to_pay
                .try_into()
                .map_err(|_| ContractError::ArithmeticOverflow)?,
        )?;

        Ok(())
    }

    pub fn update_metadata_uri(ctx: Context<UpdateMetadata>, new_uri: String) -> Result<()> {
        require!(
            new_uri.len() <= MAX_METADATA_URI_LEN,
            ContractError::MetadataUriTooLong
        );
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.property.authority,
            ContractError::Unauthorized
        );
        ctx.accounts.property.metadata_uri = new_uri;
        Ok(())
    }

    pub fn close_property(ctx: Context<CloseProperty>) -> Result<()> {
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.property.authority,
            ContractError::Unauthorized
        );
        ctx.accounts.property.active = false;
        Ok(())
    }

    pub fn init_metadata_only(
        ctx: Context<InitMetadata>,
        metadata_name: String,
        metadata_symbol: String,
        metadata_uri: String,
    ) -> Result<()> {
        require!(
            metadata_name.len() <= MAX_METADATA_NAME_LEN,
            ContractError::MetadataNameTooLong
        );
        require!(
            metadata_symbol.len() <= MAX_METADATA_SYMBOL_LEN,
            ContractError::MetadataSymbolTooLong
        );
        require!(
            metadata_uri.len() <= MAX_METADATA_URI_LEN,
            ContractError::MetadataUriTooLong
        );
        require_keys_eq!(
            ctx.accounts.authority.key(),
            ctx.accounts.property.authority,
            ContractError::Unauthorized
        );

        let property_key = ctx.accounts.property.key();
        let (expected_vault, vault_bump) =
            Pubkey::find_program_address(&[VAULT_SEED, property_key.as_ref()], &crate::ID);
        require_keys_eq!(
            ctx.accounts.vault.key(),
            expected_vault,
            ContractError::InvalidVault
        );
        let vault_bump_seed = [vault_bump];
        let vault_signer: &[&[u8]] = &[VAULT_SEED, property_key.as_ref(), &vault_bump_seed];
        let signer = &[vault_signer];

        ctx.accounts.property.metadata_uri = metadata_uri.clone();

        create_metadata(
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.authority.to_account_info(),
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.token_metadata_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
            metadata_name,
            metadata_symbol,
            metadata_uri,
            signer,
        )?;

        Ok(())
    }
}

fn create_metadata<'info>(
    mint: AccountInfo<'info>,
    vault: AccountInfo<'info>,
    authority: AccountInfo<'info>,
    metadata_account: AccountInfo<'info>,
    token_metadata_program: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
    rent: AccountInfo<'info>,
    name: String,
    symbol: String,
    uri: String,
    signer: &[&[&[u8]]],
) -> Result<()> {
    let expected_metadata = Pubkey::find_program_address(
        &[METADATA_SEED, metadata::ID.as_ref(), mint.key.as_ref()],
        &metadata::ID,
    )
    .0;
    require_keys_eq!(metadata_account.key(), expected_metadata, ContractError::InvalidMetadata);
    require_keys_eq!(
        token_metadata_program.key(),
        metadata::ID,
        ContractError::InvalidMetadataProgram
    );

    let data = metadata::mpl_token_metadata::types::DataV2 {
        name,
        symbol,
        uri,
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    metadata::create_metadata_accounts_v3(
        CpiContext::new_with_signer(
            token_metadata_program,
            CreateMetadataAccountsV3 {
                metadata: metadata_account,
                mint,
                mint_authority: vault,
                payer: authority.clone(),
                update_authority: authority,
                system_program,
                rent,
            },
            signer,
        ),
        data,
        true,
        true,
        None,
    )?;

    Ok(())
}

fn initialize_associated_accounts(ctx: &Context<InitProperty>) -> Result<()> {
    let create_shares_ata = associated_token::Create {
        payer: ctx.accounts.authority.to_account_info(),
        associated_token: ctx.accounts.vault_shares_ata.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    associated_token::create(CpiContext::new(
        ctx.accounts.associated_token_program.to_account_info(),
        create_shares_ata,
    ))?;

    let create_vault_usdc = associated_token::Create {
        payer: ctx.accounts.authority.to_account_info(),
        associated_token: ctx.accounts.vault_usdc_ata.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),
        mint: ctx.accounts.usdc_mint.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    associated_token::create(CpiContext::new(
        ctx.accounts.associated_token_program.to_account_info(),
        create_vault_usdc,
    ))?;

    let create_pool_usdc = associated_token::Create {
        payer: ctx.accounts.authority.to_account_info(),
        associated_token: ctx.accounts.pool_usdc_ata.to_account_info(),
        authority: ctx.accounts.pool.to_account_info(),
        mint: ctx.accounts.usdc_mint.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        token_program: ctx.accounts.token_program.to_account_info(),
    };
    associated_token::create(CpiContext::new(
        ctx.accounts.associated_token_program.to_account_info(),
        create_pool_usdc,
    ))?;

    Ok(())
}
