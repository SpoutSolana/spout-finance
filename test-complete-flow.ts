import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Spoutsolana } from "../target/types/spoutsolana";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

describe("Complete KYC Flow Testing", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Spoutsolana as Program<Spoutsolana>;

  let configPda: PublicKey;
  let configBump: number;
  let authority: Keypair;
  let user: Keypair;
  let mint: Keypair;
  let assetPda: PublicKey;
  let schemaPda: PublicKey;
  let credentialPda: PublicKey;

  const schemaId = "kyc-basic";
  const mockSasProgramId = Keypair.generate().publicKey;

  before(async () => {
    // Generate test keypairs
    authority = Keypair.generate();
    user = Keypair.generate();
    mint = Keypair.generate();

    // Use the provider wallet as the payer instead of airdropping
    console.log("Using provider wallet as payer:", provider.wallet.publicKey.toString());

    // Derive PDAs
    [configPda, configBump] = PublicKey.findProgramAddressSync(
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
    console.log("Mint:", mint.publicKey.toString());
    console.log("Asset PDA:", assetPda.toString());
    console.log("Schema PDA:", schemaPda.toString());
    console.log("Credential PDA:", credentialPda.toString());
  });

  it("Step 1: Initialize the program", async () => {
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

    console.log("✅ Initialize transaction signature:", tx);

    const configAccount = await program.account.config.fetch(configPda);
    console.log("Config account:", {
      authority: configAccount.authority.toString(),
      sasProgram: configAccount.sasProgram.toString(),
      bump: configAccount.bump,
    });

    expect(configAccount.authority.toString()).to.equal(authority.publicKey.toString());
    expect(configAccount.sasProgram.toString()).to.equal(mockSasProgramId.toString());
  });

  it("Step 2: Create a KYC schema", async () => {
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
      {
        name: "kyc_level",
        fieldType: { number: {} },
        required: false,
      },
    ];

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

    console.log("✅ Create schema transaction signature:", tx);

    const schemaAccount = await program.account.sasSchema.fetch(schemaPda);
    console.log("Schema account:", {
      schemaId: schemaAccount.schemaId,
      issuer: schemaAccount.issuer.toString(),
      createdAt: schemaAccount.createdAt,
      fieldsCount: schemaAccount.fields.length,
      bump: schemaAccount.bump,
    });

    expect(schemaAccount.schemaId).to.equal(schemaId);
    expect(schemaAccount.issuer.toString()).to.equal(authority.publicKey.toString());
    expect(schemaAccount.fields.length).to.equal(4);
  });

  it("Step 3: Create an asset that requires KYC", async () => {
    const tx = await program.methods
      .createAsset({
        name: "Real Estate Token",
        symbol: "RET",
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

    console.log("✅ Create asset transaction signature:", tx);

    const assetAccount = await program.account.asset.fetch(assetPda);
    console.log("Asset account:", {
      mint: assetAccount.mint.toString(),
      name: assetAccount.name,
      symbol: assetAccount.symbol,
      totalSupply: assetAccount.totalSupply.toString(),
      kycRequired: assetAccount.kycRequired,
      kycSchemaId: assetAccount.kycSchemaId,
      bump: assetAccount.bump,
    });

    expect(assetAccount.mint.toString()).to.equal(mint.publicKey.toString());
    expect(assetAccount.kycRequired).to.be.true;
    expect(assetAccount.kycSchemaId).to.equal(schemaId);
  });

  it("Step 4: User creates a KYC credential", async () => {
    const credentialData = Buffer.from(JSON.stringify({
      full_name: "John Doe",
      email: "john.doe@example.com",
      verified: true,
      kyc_level: 2
    }));

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

    console.log("✅ Create credential transaction signature:", tx);

    const credentialAccount = await program.account.sasCredential.fetch(credentialPda);
    console.log("Credential account:", {
      holder: credentialAccount.holder.toString(),
      schemaId: credentialAccount.schemaId,
      issuer: credentialAccount.issuer.toString(),
      issuedAt: credentialAccount.issuedAt,
      expiresAt: credentialAccount.expiresAt,
      revoked: credentialAccount.revoked,
      dataLength: credentialAccount.data.length,
      bump: credentialAccount.bump,
    });

    expect(credentialAccount.holder.toString()).to.equal(user.publicKey.toString());
    expect(credentialAccount.schemaId).to.equal(schemaId);
    expect(credentialAccount.revoked).to.be.false;
  });

  it("Step 5: Verify the user's KYC credential", async () => {
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

    console.log("✅ Verify KYC transaction signature:", tx);
    console.log("🎉 KYC verification successful! User is verified for this asset.");
  });

  it("Step 6: Test verification with unverified user (should fail)", async () => {
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
      
      expect.fail("Expected verification to fail for unverified user");
    } catch (error) {
      console.log("✅ Expected error for unverified user:", error.message);
      expect(error.message).to.include("AccountNotInitialized");
    }
  });
});
