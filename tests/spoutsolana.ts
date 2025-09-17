import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Spoutsolana } from "../target/types/spoutsolana";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

describe("spoutsolana", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.spoutsolana as Program<Spoutsolana>;

  it("initializes config and creates asset", async () => {
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const payer = (provider.wallet as anchor.Wallet).payer;

    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    await program.methods
      .initialize({ authority: payer.publicKey })
      .accounts({
        config: configPda,
        payer: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const mint = Keypair.generate();
    const [assetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("asset"), mint.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createAsset({ name: "Test Bond", symbol: "TBND", totalSupply: new BN(1_000_000) })
      .accounts({
        config: configPda,
        asset: assetPda,
        mint: mint.publicKey,
        authority: payer.publicKey,
        payer: payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([])
      .rpc();
  });
});
