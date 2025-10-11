import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Spoutsolana } from "../target/types/spoutsolana";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";

// Configure the client to use the local cluster
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

const program = anchor.workspace.Spoutsolana as Program<Spoutsolana>;

describe("Schema Creation Testing", () => {
  let configPda: PublicKey;
  let configBump: number;
  let authority: Keypair;

  before(async () => {
    // Generate test keypairs
    authority = Keypair.generate();
    
    // Derive config PDA
    [configPda, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    console.log("Program ID:", program.programId.toString());
    console.log("Config PDA:", configPda.toString());
    console.log("Authority:", authority.publicKey.toString());
  });

  it("Initialize the program", async () => {
    try {
      const mockSasProgramId = Keypair.generate().publicKey;
      
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

      console.log("Initialize transaction signature:", tx);
    } catch (error) {
      console.error("Initialize error:", error);
      throw error;
    }
  });

  it("Create a KYC schema", async () => {
    try {
      const schemaId = "kyc-basic";
      
      // Define schema fields
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

      // Derive schema PDA
      const [schemaPda, schemaBump] = PublicKey.findProgramAddressSync(
        [Buffer.from("schema"), Buffer.from(schemaId)],
        program.programId
      );

      console.log("Schema PDA:", schemaPda.toString());

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

      console.log("Create schema transaction signature:", tx);

      // Fetch the schema account
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
    } catch (error) {
      console.error("Create schema error:", error);
      throw error;
    }
  });
});
