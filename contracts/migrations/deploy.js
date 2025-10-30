const anchor = require("@coral-xyz/anchor");

module.exports = async function (provider) {
  anchor.setProvider(provider);

  const program = anchor.workspace.Spoutsolana;

  const sasProgramIdStr = process.env.SAS_PROGRAM_ID;
  if (!sasProgramIdStr) {
    throw new Error("SAS_PROGRAM_ID env var is required to initialize config.sas_program");
  }

  const sasProgram = new anchor.web3.PublicKey(sasProgramIdStr);

  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const payer = provider.wallet.publicKey;

  await program.methods
    .initialize({ authority: payer, sasProgram })
    .accounts({
      config: configPda,
      payer,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
};


