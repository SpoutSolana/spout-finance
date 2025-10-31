# Spout Finance Monorepo

## SpoutSolana: KYC‑Gated Token Operations and Order Management

### What this repo provides
- **Anchor program (`spoutsolana`)** implementing:
  - KYC‑gated mint/burn/transfer for a Token‑2022 RWA mint (sLQD)
  - Order management to buy/sell assets with manual or oracle pricing
  - On‑chain price feed PDA updatable by `config.authority`
  - Order events for transaction history
- **Scripts** to initialize config, attest users via SAS, create ATAs, mint USDC/sLQD, update price feed, and fetch order history.

---

## Architecture Overview

### Programs
- **SpoutSolana Program**: `programs/spoutsolana` (Anchor)
- **SPL Token (classic)**: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` (USDC)
- **SPL Token‑2022**: `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (sLQD)
- **SAS (Solana Attestation Service)**: `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG`

### Key Accounts (PDAs)
- `config` PDA: global program config (holds `authority`)
- `orders_authority` PDA: signer PDA for order flows
- `order_events` PDA: stores event ring buffer / marker (and used as a stable address for event parsing contexts)
- `price_feed` PDA: custom on‑chain feed containing `{ price, confidence, expo, timestamp, bump }`
- `program_authority` PDA: permanent delegate and/or authority for the sLQD mint
- User SAS attestation PDA: derived off SAS program with seeds `["attestation", credentialPda, schemaPda, userPubkey]`
- Token ATAs: associated token accounts for USDC (classic) and sLQD (Token‑2022)

### Tokens
- **USDC (mock)**: classic SPL token for quote currency (6 decimals)
- **sLQD (RWA)**: Token‑2022 mint (6 decimals), PermanentDelegate set to program authority PDA

---

## Repository Layout

- `programs/spoutsolana/src/lib.rs`: Anchor entrypoints; wires modules and instruction handlers
- `programs/spoutsolana/src/orders.rs`: buy/sell (manual and oracle), event emission, KYC checks
- `programs/spoutsolana/src/state.rs`: config/state types
- `programs/spoutsolana/src/price_feed.rs`: PriceFeed account and initialize/update instructions
- `programs/spoutsolana/src/errors.rs`: program error codes (e.g., `KycVerificationFailed`)
- `scripts/`: Node/TS operational scripts (attestations, tokens, orders, history)
- `json/`: Cached configuration (issuer keys, mints, schema/credential PDAs)

---

## Building and Deploying

### Prereqs
- Node 18+, Yarn/NPM
- Rust + Anchor CLI
- Solana CLI configured to the target cluster (e.g., devnet)

### Build
```bash
anchor build
```

### Deploy
```bash
anchor deploy
```

If you change program IDs, update the local IDL and client constants (e.g., `target/idl/spoutsolana.json` and any hardcoded `PROGRAM_ID`).

---

## Price Feed

### Account
The `PriceFeed` PDA is at seeds `[b"price_feed"]` and stores:
```text
price: u64           // e.g., 111_820_000 for 111.82 with expo -6
confidence: u64
expo: i32            // exponent, typically -6 for 6 decimals
timestamp: i64       // unix seconds
bump: u8
```

### Initialize
```bash
node scripts/setup/init-config.ts          # if needed to ensure config exists
node -e "require('./target/types/spoutsolana');"  # placeholder to ensure TS builds
# Implement a script similar to scripts/orders/ to call initialize_price_feed
```

Anchor client example:
```ts
// initialize_price_feed (payer funds rent)
await program.methods.initializePriceFeed().accounts({
  priceFeed,
  config,
  payer,
  systemProgram: SystemProgram.programId,
}).rpc();
```

### Update (by config.authority)
```ts
await program.methods.updatePrice(new BN(111_820_000), new BN(1000), -6).accounts({
  priceFeed,
  config,
  authority: configAuthority,
}).rpc();
```

### Consumption in Orders
- `buy_asset`/`sell_asset` read `price_feed` directly for oracle mode.
- `buy_asset_manual`/`sell_asset_manual` accept a manual price, but still pass a `price_feed` account (unchecked in manual path).

---

## KYC via SAS

### Required PDAs (devnet examples)
- `CREDENTIAL_PDA`: from `json/credential-info.json`
- `SCHEMA_PDA`: from `json/schema-info.json`
- `ATTESTATION_PDA`: per user, derived via SAS seeds

### Attestation PDA Derivation
```ts
// Include the required "attestation" seed prefix per SAS
PublicKey.findProgramAddressSync([
  Buffer.from('attestation'),
  credentialPda.toBuffer(),
  schemaPda.toBuffer(),
  userPubkey.toBuffer(),
], SAS_PROGRAM_ID);
```

### Backend Attestation Script
See `scripts/attestations/attest-backend-gill.ts` – hardcoded RPC, issuer secret, credential/schema/user PDAs for ease of backend ops.

---

## Token Setup

### sLQD (Token‑2022) Mint
- Decimals: 6
- PermanentDelegate: program authority PDA
- Token program: Token‑2022

To set PermanentDelegate (from CLI):
```bash
spl-token-2022 authorize <S L Q D _ M I N T> mint <PROGRAM_AUTHORITY_PDA>
```

### USDC (Classic SPL) Mint
- Decimals: 6
- Token program: classic SPL

### Associated Token Accounts (ATAs)
- Classic: derive with `TOKEN_PROGRAM_ID` + `ASSOCIATED_TOKEN_PROGRAM_ID`
- Token‑2022: derive with `TOKEN_2022_PROGRAM_ID` + `ASSOCIATED_TOKEN_PROGRAM_ID`

Example (Token‑2022 ATA for sLQD):
```ts
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

const ata = getAssociatedTokenAddressSync(
  slqdMint,
  userPubkey,
  false,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
);
```

Create idempotently:
```ts
createAssociatedTokenAccountIdempotentInstruction(
  payer,
  ata,
  owner,
  mint,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
)
```

---

## Orders: Buy/Sell Flows

### Manual Pricing
- `buy_asset_manual(ticker, usdc_amount, manual_price)`
  - Transfers USDC from user USDC ATA → treasury USDC ATA
  - Emits `BuyOrderCreated { created_at, ... }`
- `sell_asset_manual(ticker, asset_amount, manual_price)`
  - Transfers sLQD from user sLQD ATA → program flow, returns USDC from treasury to user
  - Emits `SellOrderCreated { created_at, ... }`

Treasury USDC ATA is the ATA for `CONFIG_PDA` over the USDC mint (classic SPL). When deriving ATAs for PDAs, set `allowOwnerOffCurve=true`.

### Oracle Pricing
- `buy_asset` / `sell_asset` read from `price_feed` PDA (set expo/price to match 6 decimal convention)

### Required Accounts (typical)
- `user`, `user_usdc_ata`, `user_slqd_ata`
- `order_events`, `orders_authority`, `config`
- `orders_usdc_account` (treasury USDC ATA owned by `CONFIG_PDA`)
- `usdc_mint`, `slqd_mint`
- `attestation_account`, `schema_account`, `credential_account`, `sas_program`
- `price_feed`
- `token_program` (classic for USDC flows), `token_2022_program` (for sLQD), `associated_token_program`, `system_program`

---

## Transaction History

We emit Anchor events on buy/sell. Use scripts to fetch and parse:
- `scripts/orders/fetch-transaction-history.ts`: batch RPC requests, retry on 429, parse events via Anchor `EventParser`.
- `scripts/orders/fetch-events-client.ts`: client utilities for fetching/listening.
- `scripts/orders/use-transaction-history.ts`: React hook; pass `autoFetch=false` by default and call `refetch()`.

Notes:
- Older events may not include `created_at`; fall back to `oracleTimestamp` or local time.
- Respect RPC rate limits using batching + delays.

---

## Common Commands

### Build and Deploy
```bash
anchor build && anchor deploy
```

### Mint USDC (classic) to a user
```bash
node -e "const {Connection,PublicKey,Transaction,sendAndConfirmTransaction,Keypair}=require('@solana/web3.js'); const {getAssociatedTokenAddressSync,createAssociatedTokenAccountIdempotentInstruction,createMintToCheckedInstruction,ASSOCIATED_TOKEN_PROGRAM_ID,TOKEN_PROGRAM_ID}=require('@solana/spl-token'); const fs=require('fs'); const bs58=require('bs58'); (async()=>{ const conn=new Connection('https://api.devnet.solana.com','confirmed'); const usdc=JSON.parse(fs.readFileSync('./json/usdc-mint.json','utf8')); const MINT=new PublicKey(usdc.mint); const DEC=usdc.decimals||6; const OWNER=new PublicKey('<USER_PUBKEY>'); const ata=getAssociatedTokenAddressSync(MINT, OWNER, false, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID); const kp=JSON.parse(fs.readFileSync('./json/keypair-info.json','utf8')); const mintAuth=Keypair.fromSecretKey(bs58.decode(kp.keypair.private_key_base58)); const ix1=createAssociatedTokenAccountIdempotentInstruction(mintAuth.publicKey, ata, OWNER, MINT, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID); const amount=3000n*1000000n; const ix2=createMintToCheckedInstruction(MINT, ata, mintAuth.publicKey, Number(amount), DEC, [], TOKEN_PROGRAM_ID); const tx=new Transaction().add(ix1, ix2); const sig=await sendAndConfirmTransaction(conn, tx, [mintAuth], {commitment:'confirmed'}); console.log('USDC ATA:', ata.toBase58()); console.log('Minted 3000 USDC. Tx:', sig); })().catch(e=>{ console.error(e); process.exit(1);});"
```

### Create Token‑2022 ATA for sLQD
```bash
node scripts/tokens/create-ata-2022.ts
```

### Update Price to 111.82 (expo -6)
```ts
await program.methods.updatePrice(new BN(111_820_000), new BN(1000), -6).accounts({ priceFeed, config, authority }).rpc();
```

---

## Troubleshooting

- **InstructionFallbackNotFound (0x65)**: Program out of sync with IDL. Rebuild and redeploy. Ensure client discriminators match on‑chain.
- **AccountNotInitialized (ATAs)**: Create the correct ATA with the correct token program (classic vs 2022). For PDAs as owners, pass `allowOwnerOffCurve=true` when deriving; use idempotent ATA creation.
- **KycVerificationFailed**: Wrong attestation PDA derivation. Include the `"attestation"` seed prefix and use the correct SAS program ID and credential/schema PDAs.
- **owner does not match**: Often due to deriving ATAs with the wrong token program (classic vs 2022). Ensure Token‑2022 for sLQD paths.
- **RPC 429 rate limit**: Use batching, delays, and retries. Reduce `commitment` or widen time windows.

---

## Frontend/Backend Notes

- Frontend hooks in `scripts/orders/use-transaction-history.ts` and `useBuyAssetManual` patterns show how to manually build instructions with Borsh to bypass IDL issues.
- Backend scripts hardcode devnet constants for clarity. Update `json/` files (`keypair-info.json`, `slqd-mint-2022.json`, `usdc-mint.json`, `schema-info.json`, etc.) as sources of truth.

---

## Checklist to Go Live on Devnet
- [ ] Build and deploy program
- [ ] Initialize `config` and set `authority`
- [ ] Create sLQD Token‑2022 mint (6 decimals); set PermanentDelegate to `program_authority` PDA
- [ ] Initialize `price_feed`; set price via `update_price`
- [ ] Create treasury USDC ATA for `CONFIG_PDA`
- [ ] Attest users via SAS; verify attestation PDA derivation
- [ ] Fund users with USDC; verify ATAs
- [ ] Execute `buy_asset_manual`/`sell_asset_manual`; verify events
- [ ] Switch to oracle `buy_asset`/`sell_asset` once feed confirmed

---

## References
- `programs/spoutsolana/src/orders.rs`: order logic and event emission
- `programs/spoutsolana/src/price_feed.rs`: price feed account and handlers
- `PYTH_INTEGRATION_SUMMARY.md`, `KYC_TOKEN_INTEGRATION.md`, `SAS_CPI_TEST_RESULTS.md`: integration notes
- `scripts/orders/fetch-transaction-history.ts`: event fetching implementation


