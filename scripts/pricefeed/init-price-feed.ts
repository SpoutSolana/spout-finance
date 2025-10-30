import { Connection, PublicKey, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";
import crypto from "crypto";

const PROGRAM_ID = new PublicKey("EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB");
const CONFIG_SEED = Buffer.from("config_v2");
const PRICE_FEED_SEED = Buffer.from("price_feed");

function disc(name: string): Buffer {
  const h = crypto.createHash("sha256").update(`global:${name}`).digest();
  return h.subarray(0, 8);
}

async function main() {
  const rpc = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");

  const issuerJson = JSON.parse(fs.readFileSync("./json/keypair-info.json", "utf8"));
  const payer = Keypair.fromSecretKey(bs58.decode(issuerJson.keypair.private_key_base58));

  const [configPda] = PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
  const [priceFeedPda] = PublicKey.findProgramAddressSync([PRICE_FEED_SEED], PROGRAM_ID);

  const data = disc("initialize_price_feed");
  const keys = [
    { pubkey: priceFeedPda, isSigner: false, isWritable: true },
    { pubkey: configPda, isSigner: false, isWritable: false },
    { pubkey: payer.publicKey, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  const ix = { programId: PROGRAM_ID, keys, data } as any;
  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
  console.log("PriceFeed PDA:", priceFeedPda.toBase58());
  console.log("Tx:", sig);
}

main().catch((e) => { console.error(e); process.exit(1); });


