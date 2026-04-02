/**
 * Server-side API route to fetch a signed Chainlink Data Streams report.
 *
 * The Chainlink API requires HMAC authentication (CHAINLINK_API_KEY + HMAC_SECRET),
 * so this must run server-side. Returns the full signed report + Snappy-compressed
 * version for on-chain submission.
 *
 * Query params:
 *   feedId - hex feed ID (with or without 0x prefix)
 */
import SnappyJS from "snappyjs";

declare const process: any;

const CHAINLINK_ENDPOINT = "https://api.testnet-dataengine.chain.link";
const CHAINLINK_WS_ENDPOINT = "wss://ws.testnet-dataengine.chain.link";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let feedId = searchParams.get("feedId");

  if (!feedId) {
    return new Response(JSON.stringify({ error: "feedId query param required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!feedId.startsWith("0x")) {
    feedId = "0x" + feedId;
  }

  const apiKey = process.env.CHAINLINK_API_KEY;
  const hmacSecret = process.env.HMAC_SECRET;

  if (!apiKey || !hmacSecret) {
    return new Response(
      JSON.stringify({ error: "Chainlink credentials not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const sdk = require("@chainlink/data-streams-sdk");
    const client = sdk.createClient({
      apiKey,
      userSecret: hmacSecret,
      endpoint: CHAINLINK_ENDPOINT,
      wsEndpoint: CHAINLINK_WS_ENDPOINT,
    });

    const report = await client.getLatestReport(feedId);
    const decoded = sdk.decodeReport(report.fullReport, feedId);

    // Convert full report hex to Buffer
    const fullReportHex = report.fullReport.replace("0x", "");
    const fullReportBytes = Buffer.from(fullReportHex, "hex");

    // Snappy-compress for Solana tx size limit
    const compressedReport = Buffer.from(SnappyJS.compress(fullReportBytes));

    // First 32 bytes of full report = config digest (needed for report_config PDA derivation)
    const reportConfigSeed = fullReportBytes.subarray(0, 32);

    // Extract price info for display
    const midPrice = decoded.mid.toString();
    const marketStatus = Number(decoded.marketStatus);

    return new Response(
      JSON.stringify({
        compressedReport: compressedReport.toString("base64"),
        reportConfigSeed: reportConfigSeed.toString("base64"),
        fullReportLength: fullReportBytes.length,
        compressedLength: compressedReport.length,
        midPrice,
        marketStatus,
        validFromTimestamp: report.validFromTimestamp,
        observationsTimestamp: report.observationsTimestamp,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    console.error("Chainlink report fetch failed:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Failed to fetch Chainlink report" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
