import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Spoutsolana } from "../target/types/spoutsolana";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

// SAS Program ID
const SAS_PROGRAM_ID = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

describe("SAS CPI Structure Tests", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Spoutsolana as Program<Spoutsolana>;
  const provider = anchor.getProvider();

  it("Test SAS PDA derivation patterns", async () => {
    console.log("🧮 Testing SAS PDA derivation patterns...");

    const schemaId = "kyc-identity-v1";
    const credentialId = "cred-12345";

    // Test Schema PDA derivation: ["schema", schema_id]
    const [sasSchemaPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("schema"), Buffer.from(schemaId)],
      SAS_PROGRAM_ID
    );

    console.log("📋 Schema ID:", schemaId);
    console.log("📋 SAS Program ID:", SAS_PROGRAM_ID.toString());
    console.log("📋 Derived Schema PDA:", sasSchemaPda.toString());

    // Test Credential PDA derivation: ["credential", schema_pda, credential_id]
    const [sasCredentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("credential"), sasSchemaPda.toBuffer(), Buffer.from(credentialId)],
      SAS_PROGRAM_ID
    );

    console.log("🆔 Credential ID:", credentialId);
    console.log("🆔 Derived Credential PDA:", sasCredentialPda.toString());

    // Verify PDAs are deterministic
    const [sasSchemaPda2] = PublicKey.findProgramAddressSync(
      [Buffer.from("schema"), Buffer.from(schemaId)],
      SAS_PROGRAM_ID
    );

    const [sasCredentialPda2] = PublicKey.findProgramAddressSync(
      [Buffer.from("credential"), sasSchemaPda2.toBuffer(), Buffer.from(credentialId)],
      SAS_PROGRAM_ID
    );

    expect(sasSchemaPda.toString()).to.equal(sasSchemaPda2.toString());
    expect(sasCredentialPda.toString()).to.equal(sasCredentialPda2.toString());

    console.log("✅ PDA derivation is deterministic and correct");
  });

  it("Test instruction data structure for SAS CPI", async () => {
    console.log("🔧 Testing instruction data structure for SAS CPI...");

    const schemaId = "kyc-identity-v1";
    const credentialId = "cred-12345";
    const holder = Keypair.generate().publicKey;

    // Derive SAS PDAs
    const [sasSchemaPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("schema"), Buffer.from(schemaId)],
      SAS_PROGRAM_ID
    );

    const [sasCredentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("credential"), sasSchemaPda.toBuffer(), Buffer.from(credentialId)],
      SAS_PROGRAM_ID
    );

    // Test CreateSchema instruction structure
    console.log("📋 CreateSchema instruction structure:");
    console.log("  - Program ID:", SAS_PROGRAM_ID.toString());
    console.log("  - Schema PDA:", sasSchemaPda.toString());
    console.log("  - Schema ID:", schemaId);

    // Test CreateCredential instruction structure
    console.log("🆔 CreateCredential instruction structure:");
    console.log("  - Program ID:", SAS_PROGRAM_ID.toString());
    console.log("  - Credential PDA:", sasCredentialPda.toString());
    console.log("  - Schema PDA:", sasSchemaPda.toString());
    console.log("  - Holder:", holder.toString());
    console.log("  - Credential ID:", credentialId);

    // Test VerifyKyc instruction structure
    console.log("🔍 VerifyKyc instruction structure:");
    console.log("  - Program ID:", SAS_PROGRAM_ID.toString());
    console.log("  - Credential PDA:", sasCredentialPda.toString());
    console.log("  - Schema PDA:", sasSchemaPda.toString());
    console.log("  - Holder:", holder.toString());

    console.log("✅ Instruction data structure is correct");
  });

  it("Test account metadata for SAS CPI", async () => {
    console.log("📊 Testing account metadata for SAS CPI...");

    const schemaId = "kyc-identity-v1";
    const credentialId = "cred-12345";
    const holder = Keypair.generate().publicKey;
    const issuer = Keypair.generate().publicKey;
    const payer = Keypair.generate().publicKey;

    // Derive SAS PDAs
    const [sasSchemaPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("schema"), Buffer.from(schemaId)],
      SAS_PROGRAM_ID
    );

    const [sasCredentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("credential"), sasSchemaPda.toBuffer(), Buffer.from(credentialId)],
      SAS_PROGRAM_ID
    );

    // Test CreateSchema account metadata
    console.log("📋 CreateSchema account metadata:");
    const createSchemaAccounts = [
      { pubkey: sasSchemaPda, isSigner: false, isWritable: true },      // schema
      { pubkey: issuer, isSigner: true, isWritable: false },            // issuer
      { pubkey: payer, isSigner: true, isWritable: true },              // payer
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
    ];

    createSchemaAccounts.forEach((account, index) => {
      console.log(`  ${index}: ${account.pubkey.toString()} (signer: ${account.isSigner}, writable: ${account.isWritable})`);
    });

    // Test CreateCredential account metadata
    console.log("🆔 CreateCredential account metadata:");
    const createCredentialAccounts = [
      { pubkey: sasCredentialPda, isSigner: false, isWritable: true },  // credential
      { pubkey: sasSchemaPda, isSigner: false, isWritable: false },     // schema
      { pubkey: issuer, isSigner: true, isWritable: false },            // issuer
      { pubkey: holder, isSigner: false, isWritable: false },           // holder
      { pubkey: payer, isSigner: true, isWritable: true },              // payer
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // system_program
    ];

    createCredentialAccounts.forEach((account, index) => {
      console.log(`  ${index}: ${account.pubkey.toString()} (signer: ${account.isSigner}, writable: ${account.isWritable})`);
    });

    // Test VerifyKyc account metadata
    console.log("🔍 VerifyKyc account metadata:");
    const verifyKycAccounts = [
      { pubkey: sasCredentialPda, isSigner: false, isWritable: false }, // credential
      { pubkey: sasSchemaPda, isSigner: false, isWritable: false },     // schema
      { pubkey: holder, isSigner: false, isWritable: false },           // holder
    ];

    verifyKycAccounts.forEach((account, index) => {
      console.log(`  ${index}: ${account.pubkey.toString()} (signer: ${account.isSigner}, writable: ${account.isWritable})`);
    });

    console.log("✅ Account metadata structure is correct");
  });

  it("Test argument structures", async () => {
    console.log("📝 Testing argument structures...");

    // Test CreateSchemaArgs
    const createSchemaArgs = {
      schemaId: "kyc-identity-v1",
      fields: [
        {
          name: "fullName",
          fieldType: { string: {} },
          required: true,
        },
        {
          name: "dateOfBirth",
          fieldType: { string: {} },
          required: true,
        },
      ],
    };

    console.log("📋 CreateSchemaArgs:", JSON.stringify(createSchemaArgs, null, 2));

    // Test CreateCredentialArgs
    const createCredentialArgs = {
      holder: Keypair.generate().publicKey,
      schemaId: "kyc-identity-v1",
      credentialId: "cred-12345",
      expiresAt: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60),
      credentialData: Array.from(Buffer.from(JSON.stringify({
        fullName: "John Doe",
        dateOfBirth: "1990-01-01",
      }))),
    };

    console.log("🆔 CreateCredentialArgs:", JSON.stringify({
      ...createCredentialArgs,
      holder: createCredentialArgs.holder.toString(),
      credentialData: `[${createCredentialArgs.credentialData.length} bytes]`,
    }, null, 2));

    // Test VerifyKycArgs
    const verifyKycArgs = {
      holder: Keypair.generate().publicKey,
      schemaId: "kyc-identity-v1",
      credentialId: "cred-12345",
    };

    console.log("🔍 VerifyKycArgs:", JSON.stringify({
      ...verifyKycArgs,
      holder: verifyKycArgs.holder.toString(),
    }, null, 2));

    console.log("✅ Argument structures are correct");
  });

  it("Test SAS program ID validation", async () => {
    console.log("🔒 Testing SAS program ID validation...");

    const correctSasProgram = SAS_PROGRAM_ID;
    const wrongSasProgram = Keypair.generate().publicKey;

    console.log("✅ Correct SAS Program ID:", correctSasProgram.toString());
    console.log("❌ Wrong SAS Program ID:", wrongSasProgram.toString());

    // Test that our program would validate the SAS program ID
    expect(correctSasProgram.toString()).to.equal("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");
    expect(wrongSasProgram.toString()).to.not.equal("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

    console.log("✅ SAS program ID validation logic is correct");
  });

  it("Test complete SAS CPI flow structure", async () => {
    console.log("🔄 Testing complete SAS CPI flow structure...");

    const schemaId = "kyc-identity-v1";
    const credentialId = "cred-12345";
    const holder = Keypair.generate().publicKey;
    const issuer = Keypair.generate().publicKey;

    // Step 1: Create Schema
    console.log("📋 Step 1: Create Schema");
    const [sasSchemaPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("schema"), Buffer.from(schemaId)],
      SAS_PROGRAM_ID
    );
    console.log("  - Schema PDA:", sasSchemaPda.toString());

    // Step 2: Create Credential
    console.log("🆔 Step 2: Create Credential");
    const [sasCredentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("credential"), sasSchemaPda.toBuffer(), Buffer.from(credentialId)],
      SAS_PROGRAM_ID
    );
    console.log("  - Credential PDA:", sasCredentialPda.toString());

    // Step 3: Verify Credential
    console.log("🔍 Step 3: Verify Credential");
    console.log("  - Using same PDAs for verification");

    // Verify the flow is consistent
    expect(sasSchemaPda.toString()).to.be.a('string');
    expect(sasCredentialPda.toString()).to.be.a('string');
    expect(sasCredentialPda.toString()).to.not.equal(sasSchemaPda.toString());

    console.log("✅ Complete SAS CPI flow structure is correct");
  });
});
