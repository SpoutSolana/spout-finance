/**
 * Alpaca Broker order management.
 *
 * POST /api/alpaca/orders — Place a new order
 *   Body: { symbol, qty?, notional?, side, type, time_in_force, limit_price?, client_order_id? }
 *   Returns the full Alpaca order object (includes id, status, etc.)
 *
 * GET /api/alpaca/orders — List open orders
 *   Query: ?status=open|closed|all&symbols=SPY
 *   Returns array of Alpaca order objects
 */

declare const process: any;

const ALPACA_BASE_URL = "https://broker-api.sandbox.alpaca.markets";

function getAuth(): { auth: string; accountId: string } | null {
  const clientId = process.env.ALPACA_CLIENT_ID;
  const clientSecret = process.env.ALPACA_CLIENT_SECRET;
  const accountId = process.env.ALPACA_ACCOUNT_ID;

  if (!clientId || !clientSecret || !accountId) return null;

  return {
    auth: Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    accountId,
  };
}

// --- POST: Place an order ---
export async function POST(request: Request) {
  const creds = getAuth();
  if (!creds) {
    return new Response(
      JSON.stringify({
        error:
          "Alpaca credentials not configured. Set ALPACA_CLIENT_ID, ALPACA_CLIENT_SECRET, and ALPACA_ACCOUNT_ID in .env",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { symbol, qty, notional, side, type, time_in_force, limit_price, client_order_id } = body;

  if (!symbol || !side || !type || !time_in_force) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: symbol, side, type, time_in_force" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!qty && !notional) {
    return new Response(
      JSON.stringify({ error: "Either qty or notional is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Build Alpaca order payload
  const orderPayload: Record<string, any> = {
    symbol,
    side,
    type,
    time_in_force,
  };
  if (qty) orderPayload.qty = String(qty);
  if (notional) orderPayload.notional = String(notional);
  if (limit_price) orderPayload.limit_price = String(limit_price);
  if (client_order_id) orderPayload.client_order_id = String(client_order_id);

  try {
    const res = await fetch(
      `${ALPACA_BASE_URL}/v1/trading/accounts/${creds.accountId}/orders`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${creds.auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.message || `Alpaca returned ${res.status}`, details: data }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    // data includes: id, client_order_id, status, symbol, qty, filled_qty, side, type, limit_price, etc.
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Alpaca place order failed:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Failed to place Alpaca order" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

// --- GET: List orders ---
export async function GET(request: Request) {
  const creds = getAuth();
  if (!creds) {
    return new Response(
      JSON.stringify({ error: "Alpaca credentials not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "open";
  const symbols = searchParams.get("symbols") || "";

  const params = new URLSearchParams({ status });
  if (symbols) params.set("symbols", symbols);

  try {
    const res = await fetch(
      `${ALPACA_BASE_URL}/v1/trading/accounts/${creds.accountId}/orders?${params.toString()}`,
      {
        headers: {
          Authorization: `Basic ${creds.auth}`,
        },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: data.message || `Alpaca returned ${res.status}`, details: data }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Alpaca list orders failed:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Failed to list Alpaca orders" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
