

import { PublicKey, Keypair } from "@solana/web3.js";
import {
  deriveSchemaPda as sasDeriveSchemaPda,
  deriveCredentialPda as sasDeriveCredentialPda,
  SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
} from "sas-lib";

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
  const authorityStr = typeof params.authority === "string" ? params.authority : params.authority.toString();
  const [credentialPda] = await sasDeriveCredentialPda({ authority: authorityStr , name: params.name });
  return new PublicKey(credentialPda.toString());
}