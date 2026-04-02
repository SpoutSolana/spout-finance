"use client";

import { useState, useEffect, useCallback } from "react";

export interface MarketStatus {
  isOpen: boolean;
  label: string; // "Open" | "Closed" | "Pre-Market" | "After-Hours"
  nextEvent: string; // e.g. "Closes at 4:00 PM ET" or "Opens at 9:30 AM ET"
}

/**
 * Determines if the US stock market (NYSE/NASDAQ) is currently open.
 * Regular hours: Mon-Fri 9:30 AM - 4:00 PM ET.
 * Does not account for holidays.
 */
function getMarketStatus(): MarketStatus {
  const now = new Date();

  // Convert to ET (Eastern Time)
  const etString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const et = new Date(etString);

  const day = et.getDay(); // 0=Sun, 6=Sat
  const hours = et.getHours();
  const minutes = et.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const preMarketOpen = 4 * 60;       // 4:00 AM ET
  const marketOpen = 9 * 60 + 30;     // 9:30 AM ET
  const marketClose = 16 * 60;        // 4:00 PM ET
  const afterHoursClose = 20 * 60;    // 8:00 PM ET

  // Weekend
  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      label: "Closed",
      nextEvent: "Opens Monday 9:30 AM ET",
    };
  }

  // Regular market hours
  if (timeInMinutes >= marketOpen && timeInMinutes < marketClose) {
    const closeHour = Math.floor((marketClose - timeInMinutes) / 60);
    const closeMin = (marketClose - timeInMinutes) % 60;
    return {
      isOpen: true,
      label: "Open",
      nextEvent: `Closes in ${closeHour}h ${closeMin}m`,
    };
  }

  // Pre-market
  if (timeInMinutes >= preMarketOpen && timeInMinutes < marketOpen) {
    return {
      isOpen: false,
      label: "Pre-Market",
      nextEvent: "Opens at 9:30 AM ET",
    };
  }

  // After-hours
  if (timeInMinutes >= marketClose && timeInMinutes < afterHoursClose) {
    return {
      isOpen: false,
      label: "After-Hours",
      nextEvent: "Opens tomorrow 9:30 AM ET",
    };
  }

  // Before pre-market or after after-hours
  return {
    isOpen: false,
    label: "Closed",
    nextEvent: timeInMinutes < preMarketOpen
      ? "Pre-market at 4:00 AM ET"
      : "Opens tomorrow 9:30 AM ET",
  };
}

/** React hook: returns live market status, refreshed every 60 seconds. */
export function useMarketStatus() {
  const [status, setStatus] = useState<MarketStatus>(getMarketStatus);

  const refresh = useCallback(() => {
    setStatus(getMarketStatus());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return status;
}
