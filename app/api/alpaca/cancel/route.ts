/**
 * Cancel an Alpaca broker order.
 *
 * DELETE /api/alpaca/cancel?orderId=<alpaca_order_id>
 *
 * Uses Alpaca Broker API:
 *   DELETE /v1/trading/accounts/{account_id}/orders/{order_id}
 *
 * Returns 200 on success, 422 if order is no longer cancelable.
 */

declare const process: any;

const ALPACA_BASE_URL = "https://broker-api.sandbox.alpaca.markets";

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return new Response(
      JSON.stringify({ error: "orderId query param required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const clientId = process.env.ALPACA_CLIENT_ID;
  const clientSecret = process.env.ALPACA_CLIENT_SECRET;
  const accountId = process.env.ALPACA_ACCOUNT_ID;

  if (!clientId || !clientSecret || !accountId) {
    return new Response(
      JSON.stringify({ error: "Alpaca broker credentials not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const res = await fetch(
      `${ALPACA_BASE_URL}/v1/trading/accounts/${accountId}/orders/${orderId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (res.status === 204) {
      return new Response(
        JSON.stringify({ success: true, message: "Order cancellation accepted" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (res.status === 422) {
      return new Response(
        JSON.stringify({ error: "Order is no longer cancelable (may be filled or already cancelled)" }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await res.text();
    return new Response(
      JSON.stringify({ error: `Alpaca returned ${res.status}: ${body}` }),
      { status: res.status, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Alpaca cancel failed:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Failed to cancel Alpaca order" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
