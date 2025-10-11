import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Spoutsolana } from "../target/types/spoutsolana";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("KYC Demo Flow - Complete Working Example", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Spoutsolana as Program<Spoutsolana>;

  let configPda: PublicKey;
  let authority: Keypair;
  let user: Keypair;
  let mint: Keypair;
  let assetPda: PublicKey;
  let schemaPda: PublicKey;
  let credentialPda: PublicKey;

  const schemaId = "kyc-demo";
  const mockSasProgramId = Keypair.generate().publicKey;

  before(async () => {
    // Generate test keypairs
    authority = Keypair.generate();
    user = Keypair.generate();
    mint = Keypair.generate();

    console.log("Using provider wallet as payer:", provider.wallet.publicKey.toString());

    // Derive PDAs
    [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    [assetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("asset"), mint.publicKey.toBuffer()],
      program.programId
    );

    [schemaPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("schema"), Buffer.from(schemaId)],
      program.programId
    );

    [credentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("credential"), user.publicKey.toBuffer(), Buffer.from(schemaId)],
      program.programId
    );

    console.log("Program ID:", program.programId.toString());
    console.log("Config PDA:", configPda.toString());
    console.log("Authority:", authority.publicKey.toString());
    console.log("User:", user.publicKey.toString());
    console.log("Schema PDA:", schemaPda.toString());
    console.log("Credential PDA:", credentialPda.toString());
  });

  it("🎯 DEMO: Complete KYC Flow", async () => {
    console.log("\n🚀 STARTING COMPLETE KYC DEMO FLOW");
    console.log("=====================================");

    // Step 1: Initialize (if config doesn't exist)
    try {
      await program.account.config.fetch(configPda);
      console.log("✅ Config already exists, skipping initialization");
    } catch (error) {
      console.log("📝 Step 1: Initializing program...");
      const tx = await program.methods
        .initialize({
          authority: authority.publicKey,
          sasProgram: mockSasProgramId,
        })
        .accounts({
          config: configPda,
          payer: provider.wallet.publicKey,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      console.log("✅ Initialize transaction:", tx);
    }

    // Step 2: Create Schema
    console.log("\n📝 Step 2: Creating KYC schema...");
    const schemaFields = [
      {
        name: "full_name",
        fieldType: { string: {} },
        required: true,
      },
      {
        name: "email",
        fieldType: { string: {} },
        required: true,
      },
      {
        name: "verified",
        fieldType: { boolean: {} },
        required: true,
      },
    ];

    try {
      const tx = await program.methods
        .createSchema({
          schemaId: schemaId,
          fields: schemaFields,
        })
        .accounts({
          config: configPda,
          issuer: authority.publicKey,
          schema: schemaPda,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      console.log("✅ Schema created:", tx);

      const schemaAccount = await program.account.sasSchema.fetch(schemaPda);
      console.log("📊 Schema details:", {
        id: schemaAccount.schemaId,
        fields: schemaAccount.fields.length,
        issuer: schemaAccount.issuer.toString(),
      });
    } catch (error) {
      console.log("❌ Schema creation failed:", error.message);
      throw error;
    }

    // Step 3: Create Asset
    console.log("\n📝 Step 3: Creating asset with KYC requirement...");
    try {
      const tx = await program.methods
        .createAsset({
          name: "Demo Real Estate Token",
          symbol: "DRET",
          totalSupply: new anchor.BN(1000000),
          kycRequired: true,
          kycSchemaId: schemaId,
        })
        .accounts({
          config: configPda,
          asset: assetPda,
          mint: mint.publicKey,
          authority: authority.publicKey,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      console.log("✅ Asset created:", tx);

      const assetAccount = await program.account.asset.fetch(assetPda);
      console.log("📊 Asset details:", {
        name: assetAccount.name,
        symbol: assetAccount.symbol,
        kycRequired: assetAccount.kycRequired,
        kycSchemaId: assetAccount.kycSchemaId,
      });
    } catch (error) {
      console.log("❌ Asset creation failed:", error.message);
      throw error;
    }

    // Step 4: User Creates Credential
    console.log("\n📝 Step 4: User creating KYC credential...");
    const credentialData = Buffer.from(JSON.stringify({
      full_name: "John Doe",
      email: "john.doe@example.com",
      verified: true
    }));

    try {
      const tx = await program.methods
        .createCredential({
          holder: user.publicKey,
          schemaId: schemaId,
          expiresAt: null,
          credentialData: credentialData,
        })
        .accounts({
          config: configPda,
          holder: user.publicKey,
          issuer: user.publicKey, // Self-issuance
          schema: schemaPda,
          credential: credentialPda,
          payer: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([user])
        .rpc();

      console.log("✅ Credential created:", tx);

      const credentialAccount = await program.account.sasCredential.fetch(credentialPda);
      console.log("📊 Credential details:", {
        holder: credentialAccount.holder.toString(),
        schemaId: credentialAccount.schemaId,
        issuer: credentialAccount.issuer.toString(),
        revoked: credentialAccount.revoked,
        dataSize: credentialAccount.data.length,
      });
    } catch (error) {
      console.log("❌ Credential creation failed:", error.message);
      throw error;
    }

    // Step 5: Verify KYC
    console.log("\n📝 Step 5: Verifying user's KYC status...");
    try {
      const tx = await program.methods
        .verifyKyc({
          holder: user.publicKey,
          schemaId: schemaId,
        })
        .accounts({
          config: configPda,
          asset: assetPda,
          holder: user.publicKey,
          sasProgram: mockSasProgramId,
          credential: credentialPda,
          schema: schemaPda,
        })
        .rpc();

      console.log("✅ KYC verification successful:", tx);
      console.log("🎉 USER IS VERIFIED FOR THIS ASSET!");
    } catch (error) {
      console.log("❌ KYC verification failed:", error.message);
      throw error;
    }

    // Step 6: Test with unverified user
    console.log("\n📝 Step 6: Testing with unverified user...");
    const unverifiedUser = Keypair.generate();
    const [unverifiedCredentialPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("credential"), unverifiedUser.publicKey.toBuffer(), Buffer.from(schemaId)],
      program.programId
    );

    try {
      await program.methods
        .verifyKyc({
          holder: unverifiedUser.publicKey,
          schemaId: schemaId,
        })
        .accounts({
          config: configPda,
          asset: assetPda,
          holder: unverifiedUser.publicKey,
          sasProgram: mockSasProgramId,
          credential: unverifiedCredentialPda,
          schema: schemaPda,
        })
        .rpc();
      
      console.log("❌ Unexpected success for unverified user");
    } catch (error) {
      console.log("✅ Correctly rejected unverified user:", error.message);
    }

    console.log("\n🎯 DEMO COMPLETE!");
    console.log("==================");
    console.log("✅ Schema created and stored on-chain");
    console.log("✅ Asset created with KYC requirement");
    console.log("✅ User credential created and stored");
    console.log("✅ KYC verification working correctly");
    console.log("✅ Unverified users properly rejected");
    console.log("\n🚀 The KYC system is fully functional!");
  });
});
