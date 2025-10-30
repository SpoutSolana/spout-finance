"use client";

import { useState, useEffect } from "react";
import { getUser } from "@/lib/getUser";

export function useCurrentUser() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const user = await getUser();
        setUsername(user.username);
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  return {
    username,
    loading,
    isAuthenticated: !!username,
  };
}
