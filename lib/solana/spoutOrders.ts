import { PublicKey } from "@solana/web3.js";

// SpoutOrders program (deployed on devnet)
export const SPOUT_ORDERS_PROGRAM_ID = new PublicKey(
  "4ADjAzGERDD1TvNPAJCz5THZcPMaY3hzPAmbx5hDNcM6"
);

// onchain_id program (KYC identity registry)
export const ONCHAIN_ID_PROGRAM_ID = new PublicKey(
  "AA6GAVVBbLepqYqMmjhWJRgnC9viTtMJdb11nQyms5Bb"
);

// USDC mint on devnet (SPL Token, 6 decimals)
export const USDC_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

// --- Chainlink Data Streams (real oracle) ---

// Chainlink Verifier program on devnet
export const CHAINLINK_VERIFIER_PROGRAM = new PublicKey(
  "Gt9S41PtjR58CbG9JhJ3J6vxesqrNAswbWYbLNTMZA3c"
);

// Access controller account (used by verifier, disabled on devnet but must be valid)
export const CHAINLINK_ACCESS_CONTROLLER = new PublicKey(
  "2k3DsgwBoqrnvXKVvd7jX7aptNxdcRBdcd5HkYsGgbrb"
);

// Chainlink Data Streams V11 feed ID for SPY
export const FEED_ID_SPY =
  "0x000b220be6fe94b85d6d8e8d5d4d212f5b86a644cbcc1dbf28b9e77b6810a5ec";

// Oracle config values matching devnet deployment
export const PRICE_DECIMALS = 18;
export const MAX_STALENESS_SECONDS = 3600;

// --- Chainlink Verifier PDA derivation ---

/** Derives the Chainlink verifier_config PDA (seeded by "verifier") */
export function deriveVerifierConfig() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("verifier")],
    CHAINLINK_VERIFIER_PROGRAM
  );
}

/** Derives the Chainlink report_config PDA from the first 32 bytes of the full signed report */
export function deriveReportConfig(reportConfigSeed: Buffer) {
  return PublicKey.findProgramAddressSync(
    [reportConfigSeed],
    CHAINLINK_VERIFIER_PROGRAM
  );
}

// --- PDA derivation helpers ---
// Seeds come from programs/spoutOrders/src/constants.rs:
//   ORDER_CONFIG = b"order_config"
//   ORDERS_AUTHORITY = b"orders_authority"
//   USDC_ESCROW = b"usdc_escrow"
//   ORACLE_CONFIG = b"oracle_config"
//   ORDER = b"order"
// Identity seed comes from onchain_id: ["identity", user_pubkey]

export function deriveOrderConfig() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("order_config")],
    SPOUT_ORDERS_PROGRAM_ID
  );
}

export function deriveOrdersAuthority() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("orders_authority")],
    SPOUT_ORDERS_PROGRAM_ID
  );
}

export function deriveUsdcEscrow() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("usdc_escrow")],
    SPOUT_ORDERS_PROGRAM_ID
  );
}

export function deriveOracleConfig(tokenMint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("oracle_config"), tokenMint.toBuffer()],
    SPOUT_ORDERS_PROGRAM_ID
  );
}

export function derivePendingOrder(user: PublicKey, orderId: bigint) {
  const orderIdBuf = Buffer.alloc(8);
  orderIdBuf.writeBigUInt64LE(orderId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("order"), user.toBuffer(), orderIdBuf],
    SPOUT_ORDERS_PROGRAM_ID
  );
}

export function deriveIdentity(user: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("identity"), user.toBuffer()],
    ONCHAIN_ID_PROGRAM_ID
  );
}
