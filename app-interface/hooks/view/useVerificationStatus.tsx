import { useCallback, useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

// SAS program id (kept for reference; not directly used when calling sas-lib)
const SAS_PROGRAM_ID = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

export function useKycStatus({
  credentialPda,
  schemaPda,
  targetUser,
  rpcUrl,
  autoFetch = true,
}: {
  credentialPda: PublicKey;
  schemaPda: PublicKey;
  targetUser?: PublicKey | null;
  rpcUrl?: string;
  autoFetch?: boolean;
}) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [isKycVerified, setIsKycVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevParams = useRef<string | null>(null);

  const fetchKyc = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsKycVerified(null);
    try {
      const userPk = targetUser ?? publicKey ?? null;
      if (!userPk || !credentialPda || !schemaPda) {
        setIsKycVerified(false);
        setLoading(false);
        return;
      }

      // Dynamically import sas-lib and gill to avoid bundling issues if unavailable
      const [{ createSolanaClient }, sas] = await Promise.all([
        import("gill"),
        import("sas-lib"),
      ]);
      const { deriveAttestationPda, fetchSchema, fetchAttestation, deserializeAttestationData } = sas as any;

      const resolvedRpcUrl = rpcUrl || "https://solana-devnet.g.alchemy.com/v2/fCmYqFoeAKRXmT4X43KhU";
      const client = createSolanaClient({ urlOrMoniker: resolvedRpcUrl });

      const credential = credentialPda.toBase58();
      const schema = schemaPda.toBase58();
      const nonce = userPk.toBase58();

      const [attPda] = await deriveAttestationPda({ credential, schema, nonce });

      // Fetch schema and attestation then deserialize to inspect KYC flag and expiry
      const sch: any = await fetchSchema(client.rpc, schema as any);
      const att: any = await fetchAttestation(client.rpc, attPda as any);
      const data: any = deserializeAttestationData(sch.data, att.data.data as Uint8Array);

      const now = BigInt(Math.floor(Date.now() / 1000));
      const isValid = now < att.data.expiry && data.kycCompleted === 1;
      setIsKycVerified(Boolean(isValid));
    } catch (err: any) {
      const msg = (err?.message || "").toString();
      if (msg.includes("Account not found") || msg.includes("AccountNotFound")) {
        setIsKycVerified(false);
        setError(null);
      } else {
        setIsKycVerified(false);
        setError(msg || "Failed to check KYC");
      }
    } finally {
      setLoading(false);
    }
  }, [connection, credentialPda, schemaPda, targetUser, publicKey, rpcUrl]);

  // Auto-fetch KYC status when core ID or user or network changes, but not on every render
  useEffect(() => {
    if (!autoFetch) return;
    const userPk = targetUser ?? publicKey ?? null;
    const sig = [
      credentialPda?.toBase58?.(),
      schemaPda?.toBase58?.(),
      userPk?.toBase58?.(),
      rpcUrl || ""
    ].join(":");
    if (prevParams.current !== sig) {
      prevParams.current = sig;
      fetchKyc();
    }
  }, [autoFetch, credentialPda, schemaPda, targetUser, publicKey, rpcUrl, fetchKyc]);

  return {
    isKycVerified,
    loading,
    error,
    refetch: fetchKyc,
  };
}

export default useKycStatus;