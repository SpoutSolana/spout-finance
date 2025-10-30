import { Connection, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
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

  // Load issuer as authority (config.authority)
  const issuerJson = JSON.parse(fs.readFileSync("./json/keypair-info.json", "utf8"));
  const authority = Keypair.fromSecretKey(bs58.decode(issuerJson.keypair.private_key_base58));

  // Derive PDAs
  const [configPda] = PublicKey.findProgramAddressSync([CONFIG_SEED], PROGRAM_ID);
  const [priceFeedPda] = PublicKey.findProgramAddressSync([PRICE_FEED_SEED], PROGRAM_ID);

  // Read desired price from env or default to 111.82 with 6 decimals
  const ui = process.env.PRICE_UI ? parseFloat(process.env.PRICE_UI) : 111.82;
  const expo = -6; // store in 6-dec base units
  const price = BigInt(Math.round(ui * 1_000_000));
  const confidence = BigInt(0); // optional

  // Encode args (u64 price, u64 confidence, i32 expo)
  const data = Buffer.concat([
    disc("update_price"),
    Buffer.alloc(8),
    Buffer.alloc(8),
    Buffer.alloc(4),
  ]);
  data.writeBigUInt64LE(price, 8); // after discriminator
  data.writeBigUInt64LE(confidence, 16);
  data.writeInt32LE(expo, 24);

  const keys = [
    { pubkey: priceFeedPda, isSigner: false, isWritable: true },
    { pubkey: configPda, isSigner: false, isWritable: false },
    { pubkey: authority.publicKey, isSigner: true, isWritable: false },
  ];

  const ix = { programId: PROGRAM_ID, keys, data } as any;
  const tx = new Transaction().add(ix);
  const sig = await sendAndConfirmTransaction(connection, tx, [authority], { commitment: "confirmed" });
  console.log("Updated PriceFeed", priceFeedPda.toBase58(), "to", ui.toString());
  console.log("Tx:", sig);
}

main().catch((e) => { console.error(e); process.exit(1); });


