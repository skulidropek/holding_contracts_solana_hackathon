<!-- CHANGE: Translate token metadata guidance to English. -->
<!-- WHY: Documentation must no longer contain Russian text to respect the localization invariant. -->
<!-- QUOTE(TZ): "Replace all Russian with English" -->
<!-- REF: USER-TRANSLATE -->
<!-- SOURCE: n/a -->
# Adding Token Metadata

To attach metadata (name, symbol, image) to your token you must use the Metaplex Token Metadata standard.

## Problem

In this contract the **mint authority** is the mint PDA itself rather than a user wallet. Therefore, creating metadata requires signing on behalf of the PDA, which must be invoked through your program.

## Solutions

### Option 1: Use the Metaplex CLI (Recommended)

The simplest route is the Metaplex CLI:

```bash
# Install the Metaplex CLI
npm install -g @metaplex-foundation/metaplex-cli

# Create the metadata JSON file
cat > metadata.json << EOF
{
  "name": "Meme Token",
  "symbol": "MEME",
  "description": "My meme token",
  "image": "https://example.com/your-image.png",
  "external_url": "https://example.com"
}
EOF

# Upload the metadata (requires adding an instruction to your program)
```

### Option 2: Add a function in the program

Implement a `create_metadata` function inside the Rust program that performs a CPI into the Metaplex Token Metadata program.

### Option 3: Use external tooling

- Metaplex UI: https://www.metaplex.com/
- Token Creator: https://github.com/creator-platform/token-creator

## Metadata JSON Structure

Create a JSON file shaped like this:

```json
{
  "name": "Meme Token",
  "symbol": "MEME",
  "description": "Description of your token",
  "image": "https://example.com/your-image.png",
  "external_url": "https://example.com",
  "attributes": [
    {
      "trait_type": "Category",
      "value": "Meme"
    }
  ]
}
```

1. Upload the image to IPFS (for example via Pinata: https://www.pinata.cloud/) or any hosting provider.
2. Replace the `image` field with the URL of your hosted asset.
3. Upload the JSON file to IPFS or any hosting provider.
4. Use the JSON URL as the metadata URI for the token.

## Note

The current `scripts/add-metadata.ts` script still needs PDA signer support. Either add the helper function to the Rust program or leverage the external tools mentioned above.
