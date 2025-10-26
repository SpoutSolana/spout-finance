

import { PublicKey, Keypair } from "@solana/web3.js";
import {
  deriveSchemaPda as sasDeriveSchemaPda,
  deriveCredentialPda as sasDeriveCredentialPda,
  deriveAttestationPda as sasDeriveAttestationPda,
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  getCreateAttestationInstruction,
  SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
} from "sas-lib";
import type { Address } from "gill";

export { sasDeriveSchemaPda as deriveSchemaPda, sasDeriveCredentialPda as deriveCredentialPda };

// Manual attestation PDA derivation (bypasses SAS library issues)
export function deriveAttestationPdaManual(params: {
  credential: PublicKey | string;
  schema: PublicKey | string;
  holder: PublicKey | string;
  nonce?: number;
}): [PublicKey, number] {
  const credentialPubkey = typeof params.credential === "string" ? new PublicKey(params.credential) : params.credential;
  const schemaPubkey = typeof params.schema === "string" ? new PublicKey(params.schema) : params.schema;
  const holderPubkey = typeof params.holder === "string" ? new PublicKey(params.holder) : params.holder;
  
  return PublicKey.findProgramAddressSync(
    [
      credentialPubkey.toBuffer(),
      schemaPubkey.toBuffer(),
      holderPubkey.toBuffer(),
      Buffer.from([params.nonce || 0])
    ],
    SAS_PROGRAM_ID
  );
}

export const SAS_PROGRAM_ID = new PublicKey(SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS);

export function getSasProgramId(): PublicKey {
  return SAS_PROGRAM_ID;
}

// Minimal helper to generate an authority keypair
export function generateAuthorityKeypair(): Keypair {
  return Keypair.generate();
}

// Convenience helper: accept PublicKey or string authority, return credential PDA as PublicKey
 async function deriveCredentialPdaAsPublicKey(params: { authority: PublicKey | string; name: string }): Promise<PublicKey> {
  const authorityAddr = (
    typeof params.authority === "string" ? params.authority : params.authority.toBase58()
  ) as unknown as Address;
  const [credentialPda] = await sasDeriveCredentialPda({ authority: authorityAddr, name: params.name });
  return new PublicKey(credentialPda.toString());
}

// Convenience helper: accept credential (PublicKey|string), name, version → schema PDA as PublicKey
 async function deriveSchemaPdaAsPublicKey(params: { credential: PublicKey | string; name: string; version: number }): Promise<PublicKey> {
  const credentialAddr = (
    typeof params.credential === "string" ? params.credential : params.credential.toBase58()
  ) as unknown as Address;
  const [schemaPda] = await sasDeriveSchemaPda({ credential: credentialAddr, name: params.name, version: params.version });
  return new PublicKey(schemaPda.toString());
}

// Convenience helper: accept credential, schema, holder → attestation PDA as PublicKey
async function deriveAttestationPdaAsPublicKey(params: { 
  credential: PublicKey | string; 
  schema: PublicKey | string; 
  holder: PublicKey | string;
  nonce?: number;
}): Promise<PublicKey> {
  const [attestationPda] = deriveAttestationPdaManual(params);
  return attestationPda;
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

export async function createSchemaInstruction(params: {
  payer: PublicKey | string;
  authority: PublicKey | string;
  credential: PublicKey | string;
  name: string | Uint8Array;
  version: number;
  description: string | Uint8Array;
  fieldNames: string[] | Uint8Array;
  layout: Uint8Array;
}): Promise<any> {
  // Convert parameters to the format expected by SAS library
  const nameBytes = typeof params.name === "string" ? new TextEncoder().encode(params.name) : params.name;
  const descriptionBytes = typeof params.description === "string" ? new TextEncoder().encode(params.description) : params.description;
  const fieldNamesBytes = Array.isArray(params.fieldNames) ? new TextEncoder().encode(JSON.stringify(params.fieldNames)) : params.fieldNames;
  
  // Seed derivation from credential, name, and version
  const schemaPda = await deriveSchemaPdaAsPublicKey({
    credential: params.credential,
    name: typeof params.name === "string" ? params.name : new TextDecoder().decode(params.name),
    version: params.version
  });

  return getCreateSchemaInstruction({
    authority: (typeof params.authority === "string" ? params.authority : params.authority.toBase58()) as any,
    payer: (typeof params.payer === "string" ? params.payer : params.payer.toBase58()) as any,
    name: typeof params.name === "string" ? params.name : new TextDecoder().decode(params.name),
    credential: (typeof params.credential === "string" ? params.credential : params.credential.toBase58()) as any,
    description: typeof params.description === "string" ? params.description : new TextDecoder().decode(params.description),
    fieldNames: Array.isArray(params.fieldNames) ? params.fieldNames : JSON.parse(new TextDecoder().decode(params.fieldNames)), 
    schema: schemaPda.toString() as any,
    layout: params.layout,
  });
}

// Helper to create attestation instruction
export async function createAttestationInstruction(params: {
  payer: PublicKey | string;
  authority: PublicKey | string;
  credential: PublicKey | string;
  schema: PublicKey | string;
  holder: PublicKey | string;
  data: string |Uint8Array;
  nonce?: number;
  expiry?: number;
  tokenAccount?: PublicKey | string;
}): Promise<any> {
  // Seed derivation from credential, schema, holder, and nonce
  const attestationPda = await deriveAttestationPdaAsPublicKey({
    credential: params.credential,
    schema: params.schema,
    holder: params.holder,
    nonce: params.nonce || 0
  });

  // Create a nonce PublicKey from the holder address (as per SAS documentation)
  const noncePublicKey = typeof params.holder === "string" ? new PublicKey(params.holder) : params.holder;
  
  // For KYC attestations, we might not need a real token account
  // Try using the holder address or a system account
  const tokenAccount = params.tokenAccount || new PublicKey("11111111111111111111111111111111");

  // Handle data parameter - convert string to Uint8Array if needed
  const dataBytes = typeof params.data === "string" ? new TextEncoder().encode(params.data) : params.data;

  // Try without tokenAccount first to see if it's required
  const instructionParams: any = {
    payer: (typeof params.payer === "string" ? params.payer : params.payer.toBase58()) as any,
    authority: (typeof params.authority === "string" ? params.authority : params.authority.toBase58()) as any,
    credential: (typeof params.credential === "string" ? params.credential : params.credential.toBase58()) as any,
    schema: (typeof params.schema === "string" ? params.schema : params.schema.toBase58()) as any,
    attestation: attestationPda.toBase58() as any,
    systemProgram: "11111111111111111111111111111111" as any,
    nonce: noncePublicKey.toBase58() as any,
    data: dataBytes,
    expiry: params.expiry?.toString() as any
  };

  // Only add tokenAccount if it's provided
  if (params.tokenAccount) {
    instructionParams.tokenAccount = (typeof tokenAccount === "string" ? tokenAccount : tokenAccount.toBase58()) as any;
  }

  return getCreateAttestationInstruction(instructionParams);
}

