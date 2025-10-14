

import { PublicKey, Keypair } from "@solana/web3.js";
import {
  deriveSchemaPda as sasDeriveSchemaPda,
  deriveCredentialPda as sasDeriveCredentialPda,
  getCreateCredentialInstruction,
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

// Convenience helper: accept credential (PublicKey|string), name, version → schema PDA as PublicKey
export async function deriveSchemaPdaAsPublicKey(params: { credential: PublicKey | string; name: string; version: number }): Promise<PublicKey> {
  const credentialAddr = (
    typeof params.credential === "string" ? params.credential : params.credential.toBase58()
  ) as unknown as Address;
  const [schemaPda] = await sasDeriveSchemaPda({ credential: credentialAddr, name: params.name, version: params.version });
  return new PublicKey(schemaPda.toString());
}

// Helper to create credential instruction
export async function createCredentialInstruction(params: {
  payer: PublicKey | string;
  authority: PublicKey | string;
  name: string;
  signers: (PublicKey | string)[];
}): Promise<any> {

  // Seed derivation from authority and name
  const credentialPda = await deriveCredentialPdaAsPublicKey({
    authority: params.authority,
    name: params.name
  });

  return getCreateCredentialInstruction({
    payer: (typeof params.payer === "string" ? params.payer : params.payer.toBase58()) as any,
    credential: credentialPda.toString() as any,
    authority: (typeof params.authority === "string" ? params.authority : params.authority.toBase58()) as any,
    name: params.name,
    signers: params.signers.map(s => (typeof s === "string" ? s : s.toBase58())) as any
  });
}

