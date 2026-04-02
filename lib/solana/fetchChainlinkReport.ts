/**
 * Client-side utility to fetch a real Chainlink Data Streams signed report
 * via the /api/chainlink/report server-side route.
 *
 * Returns the Snappy-compressed report bytes (ready for on-chain submission)
 * and the report config seed (first 32 bytes of full report, for PDA derivation).
 */

export interface ChainlinkReportResult {
  /** Snappy-compressed signed report bytes (pass directly to signed_report instruction arg) */
  compressedReport: Buffer;
  /** First 32 bytes of full report — seed for Chainlink report_config PDA */
  reportConfigSeed: Buffer;
  /** Raw mid price as string (18 decimals) */
  midPrice: string;
  /** Market status: 1=closed, 2=open, 3=unknown */
  marketStatus: number;
  /** Compressed report size in bytes */
  compressedLength: number;
  /** Full (uncompressed) report size in bytes */
  fullReportLength: number;
}

export async function fetchChainlinkReport(
  feedId: string
): Promise<ChainlinkReportResult> {
  const cleanFeedId = feedId.replace("0x", "");
  const res = await fetch(`/api/chainlink/report?feedId=${cleanFeedId}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(
      `Chainlink report fetch failed (${res.status}): ${body.error}`
    );
  }

  const data = await res.json();

  return {
    compressedReport: Buffer.from(data.compressedReport, "base64"),
    reportConfigSeed: Buffer.from(data.reportConfigSeed, "base64"),
    midPrice: data.midPrice,
    marketStatus: data.marketStatus,
    compressedLength: data.compressedLength,
    fullReportLength: data.fullReportLength,
  };
}
