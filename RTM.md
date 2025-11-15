# Requirements Traceability Matrix

<!-- CHANGE: Added RTM table for explicit REQ-to-test linkage. -->
<!-- WHY: Instruction 6 demands traceability from RTM to tests. -->
<!-- QUOTE(TЗ): "На каждый REQ-ID — тест(ы) и ссылка из RTM." -->
<!-- REF: REQ-INIT -->
<!-- SOURCE: n/a -->
| REQ-ID | Description | Source Quote | Implementation | Tests |
| --- | --- | --- | --- | --- |
| REQ-INIT | Initialize property with mint, vault, pool, and mint full supply to vault. | "init_property: создать объект + mint + vault + pool ... Заминтить весь total_shares на vault_shares_ata" | programs/property_shares/src/lib.rs:19-155 | tests/meme_token.ts:175-184 |
| REQ-BUY | Exchange USDC for shares from vault while enforcing active property invariant. | "buy_shares: обмен USDC на доли ... ошибка, если property.active == false" | programs/property_shares/src/lib.rs:157-214 | tests/meme_token.ts:186-258 |
| REQ-DEPOSIT | Authority-only USDC deposits update acc_per_share accumulator. | "deposit_yield: ... authority ... acc_per_share += amount * SCALE / property.total_shares" | programs/property_shares/src/lib.rs:216-250 | tests/meme_token.ts:260-305 |
| REQ-METADATA | Allow authority to update metadata URI. | "update_metadata_uri ... authority == property.authority" | programs/property_shares/src/lib.rs:302-316 | tests/meme_token.ts:307-343 |
| REQ-CLAIM | Claim proportional rewards with idempotence via UserReward PDA. | "claim ... total_entitled = acc_per_share * user_shares / SCALE" | programs/property_shares/src/lib.rs:252-301 | tests/meme_token.ts:345-430 |
| REQ-CLOSE | Ability to mark property inactive and block new buys. | "close_property ... property.active = false" | programs/property_shares/src/lib.rs:318-325 | tests/meme_token.ts:186-258 |
