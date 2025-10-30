"use client";

import { createContext, useContext } from "react";

console.log("UserContext file loaded");

export const UserContext = createContext<{ username: string } | string>("");

export function useUser() {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUser must be used within a UserContext.Provider");
  return context;
}
