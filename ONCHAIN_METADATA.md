# Хранение метаданных токена в блокчейне

Теперь метаданные токена (название, символ, описание) можно хранить **прямо в блокчейне** без использования внешних ссылок!

## Что изменилось

Добавлена структура `TokenMetadata` в программу Anchor, которая хранит метаданные в отдельном аккаунте на блокчейне.

### Структура метаданных

```rust
pub struct TokenMetadata {
    pub name: String,          // Название токена (максимум 64 символа)
    pub symbol: String,        // Символ токена (максимум 16 символов)
    pub description: String,   // Описание токена (максимум 512 символов)
    pub image_uri: String,     // URI изображения (максимум 256 символов)
    pub update_authority: Pubkey, // Владелец метаданных
}
```

## Использование

### 1. Установите метаданные

Отредактируйте файл `scripts/set-metadata.ts` и установите ваши метаданные:

```typescript
const metadata = {
  name: "Meme Token",                    // Максимум 64 символа
  symbol: "MEME",                         // Максимум 16 символов
  description: "Мой первый мем-токен на Solana! Хранится прямо в блокчейне.",
  imageUri: "https://example.com/token-image.png", // Можно оставить пустым ""
};
```

### 2. Запустите скрипт

```bash
npm run set-metadata
```

Или с переменными окружения:

```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=/home/user/.config/solana/id.json \
npx ts-node scripts/set-metadata.ts
```

### 3. Проверьте метаданные

Метаданные хранятся в PDA аккаунте:
- Seeds: `["metadata", mint_address]`
- Можно посмотреть в Solana Explorer по адресу метаданных аккаунта

## Чтение метаданных

Метаданные можно прочитать прямо из программы или через TypeScript:

```typescript
const [metadataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("metadata"), mintAddress.toBuffer()],
  program.programId
);

// Получаем аккаунт метаданных
const metadataAccount = await program.account.tokenMetadata.fetch(metadataPDA);
console.log("Name:", metadataAccount.name);
console.log("Symbol:", metadataAccount.symbol);
console.log("Description:", metadataAccount.description);
```

## Преимущества хранения в блокчейне

✅ **Надежность**: Метаданные всегда доступны, пока существует аккаунт  
✅ **Независимость**: Не нужно полагаться на внешние хостинги  
✅ **Прозрачность**: Все метаданные видны в блокчейне  
✅ **Децентрализация**: Данные хранятся на всех узлах Solana  

## Ограничения

⚠️ **Размер данных**: Ограничен размерами строк (64 + 16 + 512 + 256 символов)  
⚠️ **Изображения**: Изображения не хранятся в блокчейне, только URI  
⚠️ **Стоимость**: Хранение данных в блокчейне требует оплаты за аренду аккаунта  

## Пример использования

```typescript
// Установка метаданных
await program.methods
  .setMetadata(
    "Meme Token",
    "MEME",
    "Описание токена",
    "https://example.com/image.png"
  )
  .accounts({
    payer: wallet.publicKey,
    mint: mintAddress,
    metadata: metadataPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Чтение метаданных
const metadata = await program.account.tokenMetadata.fetch(metadataPDA);
console.log(metadata.name); // "Meme Token"
```

## Обновление метаданных

Метод `set_metadata` использует `init_if_needed`, что означает:
- Если метаданные не существуют - они будут созданы
- Если метаданные уже существуют - они будут обновлены

Просто запустите скрипт повторно с новыми данными!

