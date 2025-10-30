import fs from "fs";
import bs58 from "bs58";
import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

// Inputs
const RECIPIENT_STR = process.env.RECIPIENT || "HXpAw6gfWFfoJFy5UhtRN7cecEUyt3mgi1LGmxKyu6Jo";

async function main() {
  const rpc = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");

  // Load Token-2022 config
  const slqdCfg = JSON.parse(fs.readFileSync("./json/slqd-mint-2022.json", "utf8"));
  const MINT = new PublicKey(slqdCfg.mint);
  const TOKEN_2022_PROGRAM_ID = new PublicKey(slqdCfg.tokenProgram);

  // Payer (issuer) from keypair-info.json
  const kpInfo = JSON.parse(fs.readFileSync("./json/keypair-info.json", "utf8"));
  const secret = bs58.decode(kpInfo.keypair.private_key_base58);
  const payer = Keypair.fromSecretKey(secret);

  const recipient = new PublicKey(RECIPIENT_STR);

  // Derive Token-2022 ATA (note: pass token program id explicitly)
  const ata = getAssociatedTokenAddressSync(
    MINT,
    recipient,
    false,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const ix = createAssociatedTokenAccountIdempotentInstruction(
    payer.publicKey,
    ata,
    recipient,
    MINT,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );

  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });

  console.log("Token-2022 ATA:", ata.toBase58());
  console.log("Tx:", sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


