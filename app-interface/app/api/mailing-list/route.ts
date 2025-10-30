import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Get OAuth2 access token using service account
async function getAccessToken(): Promise<string> {
  const jwtPayload = {
    iss: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    iat: Math.floor(Date.now() / 1000),
  };

  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const token = jwt.sign(jwtPayload, privateKey!, { algorithm: "RS256" });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: token,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to get access token: ${errorData.error_description || response.statusText}`,
    );
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Check if email already exists
    const checkResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}/values/Sheet1!A:A`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (checkResponse.ok) {
      const existingData = await checkResponse.json();
      const emails = existingData.values?.flat() || [];

      if (emails.includes(email)) {
        return NextResponse.json({
          message: "You're already on our mailing list!",
        });
      }
    }

    // Add new email with timestamp
    const addResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEET_ID}/values/Sheet1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [
            [email, new Date().toUTCString().split(" ").slice(1, 5).join(" ")],
          ],
        }),
      },
    );

    if (!addResponse.ok) {
      const errorData = await addResponse.json();
      console.error("Google Sheets API Error:", errorData);
      throw new Error(
        `Failed to add email: ${errorData.error?.message || addResponse.statusText}`,
      );
    }

    return NextResponse.json({
      message: "Thank you for joining our mailing list!",
    });
  } catch (error) {
    console.error("Mailing list error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
