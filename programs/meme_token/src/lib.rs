use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        self,
        Mint,
        MintTo,
        TokenAccount,
        TokenInterface,
    },
};

// ВСТАВЬ СЮДА program id ИЗ `anchor keys list`
declare_id!("DfBeWM1aM3dtXvyydD2wfDFc9XwcpodCqBmgdXtBRzPm");

/// Аккаунт для хранения метаданных токена в блокчейне
#[account]
pub struct TokenMetadata {
    /// Название токена (максимум 64 символа)
    pub name: String,
    /// Символ токена (максимум 16 символов)
    pub symbol: String,
    /// Описание токена (максимум 512 символов)
    pub description: String,
    /// URI для изображения (максимум 256 символов) - можно оставить пустым
    pub image_uri: String,
    /// Владелец метаданных (обычно mint PDA или update authority)
    pub update_authority: Pubkey,
}

#[program]
pub mod meme_token {
    use super::*;

    /// Один раз вызываем, чтобы создать mint нашего мем-токена.
    pub fn create_meme_mint(ctx: Context<CreateMemeMint>) -> Result<()> {
        msg!("Meme mint created at: {:?}", ctx.accounts.mint.key());
        Ok(())
    }

    /// Минтим мем-токены пользователю.
    /// amount — в минимальных единицах (с учётом decimals).
    pub fn mint_meme(ctx: Context<MintMeme>, amount: u64) -> Result<()> {
        // PDA, который выступает mint-авторити: seed "meme_mint"
        let signer_seeds: &[&[&[u8]]] = &[&[b"meme_mint", &[ctx.bumps.mint]]];

        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.user_ata.to_account_info(),
            authority: ctx.accounts.mint.to_account_info(), // mint сам себе authority
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts)
            .with_signer(signer_seeds);

        // CPI в Token / Token-2022: собственно минтинг
        token_interface::mint_to(cpi_ctx, amount)?;

        Ok(())
    }

    /// Создаёт или обновляет метаданные токена, хранящиеся в блокчейне.
    /// Метаданные хранятся в отдельном аккаунте, привязанном к mint.
    pub fn set_metadata(
        ctx: Context<SetMetadata>,
        name: String,
        symbol: String,
        description: String,
        image_uri: String,
    ) -> Result<()> {
        // Валидация длины полей
        require!(name.len() <= 64, ErrorCode::NameTooLong);
        require!(symbol.len() <= 16, ErrorCode::SymbolTooLong);
        require!(description.len() <= 512, ErrorCode::DescriptionTooLong);
        require!(image_uri.len() <= 256, ErrorCode::ImageUriTooLong);

        let metadata = &mut ctx.accounts.metadata;
        metadata.name = name;
        metadata.symbol = symbol;
        metadata.description = description;
        metadata.image_uri = image_uri;
        metadata.update_authority = ctx.accounts.mint.key();

        msg!("Metadata updated: {}", ctx.accounts.metadata.name);
        Ok(())
    }

    /// Создаёт новый токен с метаданными в одной транзакции.
    /// Метаданные становятся частью токена и хранятся в блокчейне.
    /// seed - уникальный идентификатор токена (например, "my_token_v2")
    pub fn create_token_with_metadata(
        ctx: Context<CreateTokenWithMetadata>,
        _seed: String,
        name: String,
        symbol: String,
        description: String,
        image_uri: String,
        _decimals: u8,
    ) -> Result<()> {
        // Валидация длины полей
        require!(name.len() <= 64, ErrorCode::NameTooLong);
        require!(symbol.len() <= 16, ErrorCode::SymbolTooLong);
        require!(description.len() <= 512, ErrorCode::DescriptionTooLong);
        require!(image_uri.len() <= 256, ErrorCode::ImageUriTooLong);

        // Mint уже создан через Anchor constraints
        msg!("Token created at: {:?}", ctx.accounts.mint.key());

        // Сразу создаем метаданные для этого токена
        let metadata = &mut ctx.accounts.metadata;
        metadata.name = name.clone();
        metadata.symbol = symbol;
        metadata.description = description;
        metadata.image_uri = image_uri;
        metadata.update_authority = ctx.accounts.mint.key();

        msg!("Token with metadata created: {} ({})", metadata.name, metadata.symbol);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMemeMint<'info> {
    /// Плательщик за создание аккаунта mint.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Собственно mint — PDA с сидом "meme_mint".
    #[account(
        init,
        payer = payer,
        mint::decimals = 6,               // сколько знаков после запятой
        mint::authority = mint,           // authority = сам mint (PDA)
        mint::freeze_authority = mint,    // freeze authority тоже mint
        seeds = [b"meme_mint"],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    /// Token Program или Token-2022 Program.
    pub token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MintMeme<'info> {
    /// Плательщик комиссий и владелец получаемых токенов.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// ATA пользователя под наш mint, создаётся при первом минте.
    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
        associated_token::token_program = token_program,
    )]
    pub user_ata: InterfaceAccount<'info, TokenAccount>,

    /// Наш mint (тот же PDA, что и в CreateMemeMint).
    #[account(
        mut,
        seeds = [b"meme_mint"],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetMetadata<'info> {
    /// Плательщик за создание/обновление аккаунта метаданных.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Mint токена, к которому привязаны метаданные.
    /// Не проверяем, что это PDA, просто используем как ссылку.
    pub mint: InterfaceAccount<'info, Mint>,

    /// Аккаунт метаданных. PDA с сидом "metadata" + mint адрес.
    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 4 + 64 + 4 + 16 + 4 + 512 + 4 + 256 + 32, // discriminator + fields
        seeds = [b"metadata", mint.key().as_ref()],
        bump
    )]
    pub metadata: Account<'info, TokenMetadata>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(seed: String, name: String, symbol: String, description: String, image_uri: String, decimals: u8)]
pub struct CreateTokenWithMetadata<'info> {
    /// Плательщик за создание аккаунтов mint и метаданных.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// Mint токена. Используем seed для создания уникального адреса.
    #[account(
        init,
        payer = payer,
        mint::decimals = 6, // Фиксируем decimals = 6 для упрощения
        mint::authority = mint,
        mint::freeze_authority = mint,
        seeds = [seed.as_bytes()],
        bump
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    /// Аккаунт метаданных для этого токена.
    #[account(
        init,
        payer = payer,
        space = 8 + 4 + 64 + 4 + 16 + 4 + 512 + 4 + 256 + 32,
        seeds = [b"metadata", mint.key().as_ref()],
        bump
    )]
    pub metadata: Account<'info, TokenMetadata>,

    /// Token Program или Token-2022 Program.
    pub token_program: Interface<'info, TokenInterface>,

    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Name too long (max 64 characters)")]
    NameTooLong,
    #[msg("Symbol too long (max 16 characters)")]
    SymbolTooLong,
    #[msg("Description too long (max 512 characters)")]
    DescriptionTooLong,
    #[msg("Image URI too long (max 256 characters)")]
    ImageUriTooLong,
}
