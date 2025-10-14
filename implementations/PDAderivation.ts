

import { PublicKey, Keypair } from "@solana/web3.js";
import {
  deriveSchemaPda as sasDeriveSchemaPda,
  deriveCredentialPda as sasDeriveCredentialPda,
  SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
} from "sas-lib";
import type { Address } from "gill";

export { sasDeriveSchemaPda as deriveSchemaPda, sasDeriveCredentialPda as deriveCredentialPda };

export const SAS_PROGRAM_ID = new PublicKey(SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS);

export function getSasProgramId(): PublicKey {
  return SAS_PROGRAM_ID;
}

// Minimal helper to generate an authority keypair
export function generateAuthorityKeypair(): Keypair {
  return Keypair.generate();
}

// Convenience helper: accept PublicKey or string authority, return credential PDA as PublicKey
export async function deriveCredentialPdaAsPublicKey(params: { authority: PublicKey | string; name: string }): Promise<PublicKey> {
  const authorityAddr = (
    typeof params.authority === "string" ? params.authority : params.authority.toBase58()
  ) as unknown as Address;
  const [credentialPda] = await sasDeriveCredentialPda({ authority: authorityAddr, name: params.name });
  return new PublicKey(credentialPda.toString());
}