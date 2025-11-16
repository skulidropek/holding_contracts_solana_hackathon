<!-- CHANGE: Translate the on-chain metadata guide to English. -->
<!-- WHY: Documentation must remain readable without Russian text per the localization invariant. -->
<!-- QUOTE(TZ): "Replace all Russian with English" -->
<!-- REF: USER-TRANSLATE -->
<!-- SOURCE: n/a -->
# Storing Token Metadata On-Chain

You can now keep token metadata (name, symbol, description) **directly on-chain** without referencing external URLs.

## What Changed

We added a `TokenMetadata` struct to the Anchor program that stores metadata inside a dedicated on-chain account.

### Metadata Structure

```rust
pub struct TokenMetadata {
    pub name: String,          // Token name (up to 64 characters)
    pub symbol: String,        // Token symbol (up to 16 characters)
    pub description: String,   // Token description (up to 512 characters)
    pub image_uri: String,     // Image URI (up to 256 characters)
    pub update_authority: Pubkey, // Metadata owner
}
```

## Usage

### 1. Set the metadata

Edit `scripts/set-metadata.ts` and provide your metadata:

```typescript
const metadata = {
  name: "Meme Token",                    // Maximum 64 characters
  symbol: "MEME",                        // Maximum 16 characters
  description: "My first meme token on Solana! Stored directly on-chain.",
  imageUri: "https://example.com/token-image.png", // Can be left as ""
};
```

### 2. Run the script

```bash
npm run set-metadata
```

Or with explicit environment variables:

```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com \
ANCHOR_WALLET=/home/user/.config/solana/id.json \
npx ts-node scripts/set-metadata.ts
```

### 3. Verify the metadata

Metadata lives in a PDA account:
- Seeds: `["metadata", mint_address]`
- You can inspect it via Solana Explorer using the metadata account address.

## Reading Metadata

The metadata can be read directly from the program or via TypeScript:

```typescript
const [metadataPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("metadata"), mintAddress.toBuffer()],
  program.programId
);

// Fetch the metadata account
const metadataAccount = await program.account.tokenMetadata.fetch(metadataPDA);
console.log("Name:", metadataAccount.name);
console.log("Symbol:", metadataAccount.symbol);
console.log("Description:", metadataAccount.description);
```

## Benefits of On-Chain Storage

✅ **Reliability**: Metadata remains available while the account exists.  
✅ **Independence**: No reliance on external hosting.  
✅ **Transparency**: Everyone can inspect metadata directly on-chain.  
✅ **Decentralization**: Data is replicated across all Solana validators.  

## Limitations

⚠️ **Data size**: The combined string fields are capped (64 + 16 + 512 + 256 characters).  
⚠️ **Images**: Only URIs are stored, not the binary asset.  
⚠️ **Cost**: On-chain storage requires rent for the account.  

## Example

```typescript
// Setting metadata
await program.methods
  .setMetadata(
    "Meme Token",
    "MEME",
    "Token description",
    "https://example.com/image.png"
  )
  .accounts({
    payer: wallet.publicKey,
    mint: mintAddress,
    metadata: metadataPDA,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Reading metadata
const metadata = await program.account.tokenMetadata.fetch(metadataPDA);
console.log(metadata.name); // "Meme Token"
```

## Updating Metadata

The `set_metadata` method uses `init_if_needed`, which means:
- If metadata does not exist, it is created.
- If metadata already exists, it is updated in place.

Simply rerun the script with your new data.
