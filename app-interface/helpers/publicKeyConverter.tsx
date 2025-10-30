import { PublicKey } from "@solana/web3.js";

export function toPk(maybe: string | null | undefined): PublicKey | null {
  try {
    if (!maybe) return null;
    const s = maybe.trim();
    if (!s) return null;
    return new PublicKey(s);
  } catch {
    return null;
  }
}