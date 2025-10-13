

import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";
import { Address } from "gill";

// SAS(Solana Attestation Service) ProgramID
export const SAS_PROGRAM_ID = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

export type Credential = {
    identifier: Address | string | number
    authority: Address | string | number
}

export function deriveSchemaPda(schemaId: string): PublicKey {
  const [schemaPda] = PublicKey.findProgramAddressSync(
    // Seed aggregation
    [Buffer.from("schema"), Buffer.from(schemaId)],
    SAS_PROGRAM_ID
  );
  return schemaPda;
}

// Using one credential per authority
export function deriveCredentialPda(authority: PublicKey, name: string): PublicKey {
  const [credentialPda] = PublicKey.findProgramAddressSync(
    [authority.toBuffer(), Buffer.from(name)],
    SAS_PROGRAM_ID
  );
  return credentialPda;
}

export function deriveCredentialPdaWithSchema(schemaId: string, credentialId: string): {
  schemaPda: PublicKey;
  credentialPda: PublicKey;
} {
  const schemaPda = deriveSchemaPda(schemaId);
  const [credentialPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("credential"), schemaPda.toBuffer(), Buffer.from(credentialId)],
    SAS_PROGRAM_ID
  );
  return { schemaPda, credentialPda };
}