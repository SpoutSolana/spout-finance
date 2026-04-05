/**
 * Fetch Alpaca positions for the configured account.
 *
 * GET /api/alpaca/positions
 * GET /api/alpaca/positions?symbol=SPY
 */

declare const process: any;

const ALPACA_BASE_URL = "https://broker-api.sandbox.alpaca.markets";

export async function GET(request: Request) {
  const clientId = process.env.ALPACA_CLIENT_ID;
  const clientSecret = process.env.ALPACA_CLIENT_SECRET;
  const accountId = process.env.ALPACA_ACCOUNT_ID;

  if (!clientId || !clientSecret || !accountId) {
    return new Response(
      JSON.stringify({ error: "Alpaca credentials not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  try {
    const res = await fetch(
      `${ALPACA_BASE_URL}/v1/trading/accounts/${accountId}/positions`,
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.message || `Alpaca returned ${res.status}` }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // Filter by symbol if requested
    const positions = symbol
      ? (data as any[]).filter((p: any) => p.symbol === symbol.toUpperCase())
      : data;

    return new Response(JSON.stringify(positions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Alpaca positions fetch failed:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Failed to fetch positions" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
