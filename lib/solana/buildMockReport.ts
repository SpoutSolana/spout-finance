/**
 * Builds a mock Chainlink Data Streams ReportDataV11 (448 bytes, ABI-encoded).
 *
 * When the SpoutOrders program is deployed with the `mock-oracle` feature,
 * it skips the Chainlink Verifier CPI and decodes the signed_report bytes
 * directly. This function builds those bytes client-side.
 *
 * Layout (14 × 32-byte words, ABI-encoded = big-endian):
 *   Word 0:  feed_id (bytes32)
 *   Word 1:  valid_from_timestamp (uint32)
 *   Word 2:  observations_timestamp (uint32)
 *   Word 3:  native_fee (uint192)
 *   Word 4:  link_fee (uint192)
 *   Word 5:  expires_at (uint32)
 *   Word 6:  mid (int192)
 *   Word 7:  last_seen_timestamp_ns (uint64)
 *   Word 8:  bid (int192)
 *   Word 9:  bid_volume (int192)
 *   Word 10: ask (int192)
 *   Word 11: ask_volume (int192)
 *   Word 12: last_traded_price (int192)
 *   Word 13: market_status (uint32)
 */

/**
 * Write a BigInt as big-endian bytes into a buffer.
 * Handles negative values via two's complement.
 */
function writeBigIntBE(buf: Buffer, offset: number, value: bigint, width: number) {
  let v = value;
  if (v < 0n) {
    v = (1n << BigInt(width * 8)) + v;
  }
  for (let i = width - 1; i >= 0; i--) {
    buf[offset + i] = Number(v & 0xffn);
    v >>= 8n;
  }
}

export function buildMockReportV11(feedId: Buffer, priceWithDecimals: bigint): Buffer {
  const WORD = 32;
  const buf = Buffer.alloc(14 * WORD); // 448 bytes total

  const now = Math.floor(Date.now() / 1000);
  const nowNs = BigInt(Date.now()) * 1_000_000n;

  //                                        BYTE RANGE      OFFSET ARG
  // Word 0: feed_id (bytes32)              [0..31]          0
  feedId.copy(buf, 0);

  // Word 1: valid_from_timestamp (uint32)  [32..63]         32+28=60
  //   bytes 32-59 = zero padding, bytes 60-63 = value
  buf.writeUInt32BE(now, 60);

  // Word 2: observations_timestamp (uint32) [64..95]        64+28=92
  //   bytes 64-91 = zero padding, bytes 92-95 = value
  buf.writeUInt32BE(now, 92);

  // Word 3: native_fee (uint192)           [96..127]        zeroed
  // Word 4: link_fee (uint192)             [128..159]       zeroed

  // Word 5: expires_at (uint32)            [160..191]       160+28=188
  //   bytes 160-187 = zero padding, bytes 188-191 = value
  buf.writeUInt32BE(now + 3600, 188);

  // Word 6: mid (int192)                   [192..223]       192+8=200
  //   bytes 192-199 = zero padding, bytes 200-223 = 24-byte int192
  writeBigIntBE(buf, 200, priceWithDecimals, 24);

  // Word 7: last_seen_timestamp_ns (uint64) [224..255]      224+24=248
  //   bytes 224-247 = zero padding, bytes 248-255 = value
  buf.writeBigUInt64BE(nowNs, 248);

  // Word 8: bid (int192)                   [256..287]       256+8=264
  writeBigIntBE(buf, 264, priceWithDecimals, 24);

  // Word 9: bid_volume (int192)            [288..319]       zeroed

  // Word 10: ask (int192)                  [320..351]       320+8=328
  writeBigIntBE(buf, 328, priceWithDecimals, 24);

  // Word 11: ask_volume (int192)           [352..383]       zeroed

  // Word 12: last_traded_price (int192)    [384..415]       384+8=392
  writeBigIntBE(buf, 392, priceWithDecimals, 24);

  // Word 13: market_status (uint32)        [416..447]       416+28=444
  //   bytes 416-443 = zero padding, bytes 444-447 = value (2 = open)
  buf.writeUInt32BE(2, 444);

  return buf;
}
