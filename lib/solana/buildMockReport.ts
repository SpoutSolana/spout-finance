/**
 * Builds a mock Chainlink Data Streams ReportDataV8 (288 bytes, ABI-encoded).
 *
 * When the SpoutOrders program is deployed with the `mock-oracle` feature,
 * it skips the Chainlink Verifier CPI and decodes the signed_report bytes
 * directly. This function builds those bytes client-side.
 *
 * Layout (9 × 32-byte words, ABI-encoded = big-endian, right-aligned integers):
 *   Word 0: feed_id (bytes32)
 *   Word 1: valid_from_timestamp (uint32, right-aligned)
 *   Word 2: observations_timestamp (uint32, right-aligned)
 *   Word 3: native_fee (uint192, right-aligned)
 *   Word 4: link_fee (uint192, right-aligned)
 *   Word 5: expires_at (uint32, right-aligned)
 *   Word 6: last_update_timestamp (uint64, right-aligned)
 *   Word 7: mid_price (int192, signed, right-aligned)
 *   Word 8: market_status (uint32, right-aligned)
 *
 * Ported from SolanaVault/tests/spoutOrders.ts buildMockReportV8()
 */

export interface MockReportParams {
  feedId: number[];
  validFromTimestamp: number;
  observationsTimestamp: number;
  nativeFee: bigint;
  linkFee: bigint;
  expiresAt: number;
  lastUpdateTimestamp: bigint;
  midPrice: bigint;
  marketStatus: number;
}

/**
 * Write a BigInt as big-endian into a buffer at offset,
 * right-aligned in `width` bytes. Handles negative values
 * via two's complement.
 */
function writeBigIntBE(
  buf: Buffer,
  offset: number,
  value: bigint,
  width: number
) {
  let v = value;
  if (v < BigInt(0)) {
    v = (BigInt(1) << BigInt(width * 8)) + v;
  }
  for (let i = width - 1; i >= 0; i--) {
    buf[offset + i] = Number(v & BigInt(0xff));
    v >>= BigInt(8);
  }
}

export function buildMockReportV8(params: MockReportParams): Buffer {
  const buf = Buffer.alloc(288); // 9 × 32 bytes
  let offset = 0;

  // Word 0: feed_id (bytes32) — left-aligned, no padding needed
  Buffer.from(params.feedId).copy(buf, offset);
  offset += 32;

  // Word 1: valid_from_timestamp (uint32, right-aligned in 32-byte slot)
  buf.writeUInt32BE(params.validFromTimestamp, offset + 28);
  offset += 32;

  // Word 2: observations_timestamp (uint32)
  buf.writeUInt32BE(params.observationsTimestamp, offset + 28);
  offset += 32;

  // Word 3: native_fee (uint192)
  writeBigIntBE(buf, offset, params.nativeFee, 32);
  offset += 32;

  // Word 4: link_fee (uint192)
  writeBigIntBE(buf, offset, params.linkFee, 32);
  offset += 32;

  // Word 5: expires_at (uint32)
  buf.writeUInt32BE(params.expiresAt, offset + 28);
  offset += 32;

  // Word 6: last_update_timestamp (uint64)
  writeBigIntBE(buf, offset, params.lastUpdateTimestamp, 32);
  offset += 32;

  // Word 7: mid_price (int192, signed)
  writeBigIntBE(buf, offset, params.midPrice, 32);
  offset += 32;

  // Word 8: market_status (uint32)
  buf.writeUInt32BE(params.marketStatus, offset + 28);
  offset += 32;

  return buf;
}
