import { AnchorProvider, Program, Wallet, BN } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram, clusterApiUrl } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import { deriveAttestationPda } from "sas-lib";
import fs from "fs";

async function main() {
  const RPC_URL = process.env.RPC_URL || clusterApiUrl("devnet");
  const ISSUER_PATH = process.env.ISSUER_PATH || "./funded-keypair.json"; // trusted issuer + payer

  const slqd = JSON.parse(fs.readFileSync("./json/slqd-mint.json", "utf8"));
  const schemaInfo = JSON.parse(fs.readFileSync("./schema-info.json", "utf8"));
  const credInfo = JSON.parse(fs.readFileSync("./credential-info.json", "utf8"));

  const issuer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(ISSUER_PATH, "utf8"))));
  const connection = new Connection(RPC_URL, { commitment: "confirmed" });
  const provider = new AnchorProvider(connection, new Wallet(issuer), { commitment: "confirmed" });

  const idl = JSON.parse(fs.readFileSync("./target/idl/spoutsolana.json", "utf8"));
  const PROGRAM_ID = new PublicKey("EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB");
  const program = new Program(idl, provider);

  const mint = new PublicKey(slqd.mint);
  const recipient = new PublicKey(process.env.RECIPIENT || JSON.parse(fs.readFileSync("./real-attestation-info.json", "utf8")).user.address);
  const schema = new PublicKey(schemaInfo.schema.pda);
  const credential = new PublicKey(credInfo.credential.pda);
  const sasProgram = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

  // Derive correct attestation PDA for recipient
  const [attestationPdaStr] = await deriveAttestationPda({
    credential: credential.toBase58() as any,
    schema: schema.toBase58() as any,
    nonce: recipient.toBase58() as any,
  });
  const attestation = new PublicKey(attestationPdaStr);

  const recipientTokenAccount = await getAssociatedTokenAddress(mint, recipient);

  const [programAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_authority"), mint.toBuffer()],
    PROGRAM_ID
  );

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config_v2")], PROGRAM_ID);

  console.log("Mint:", mint.toBase58());
  console.log("Recipient:", recipient.toBase58());
  console.log("Recipient ATA:", recipientTokenAccount.toBase58());
  console.log("Attestation (derived):", attestation.toBase58());

  const amount = new BN(10); // 10 tokens (program multiplies by 10^decimals)
  const sig = await program.methods
    .mintToKycUser(recipient, amount)
    .accounts({
      mint,
      recipientTokenAccount,
      attestationAccount: attestation,
      schemaAccount: schema,
      credentialAccount: credential,
      sasProgram,
      programAuthority: programAuthorityPda,
      recipient,
      issuer: issuer.publicKey,
      config: configPda,
      payer: issuer.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([issuer])
    .rpc();

  console.log("KYC mint tx:", sig);

  const ataAcc = await getAccount(connection, recipientTokenAccount);
  console.log("Recipient balance:", ataAcc.amount.toString());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


