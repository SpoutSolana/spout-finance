import { Keypair, Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { 
  createMint,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

type Idl = any;

function loadKeypairFromPath(kpPath: string): Keypair {
    const raw = fs.readFileSync(kpPath, { encoding: "utf-8" });
    const arr = JSON.parse(raw);
    const bytes = Uint8Array.from(arr.length > 64 ? arr.slice(0, 64) : arr);
    return Keypair.fromSecretKey(bytes);
}

async function main() {
    const RPC_URL = process.env.RPC_URL || clusterApiUrl("devnet");
    const PAYER_PATH = process.env.PAYER_PATH || path.join(process.env.HOME || "", "/.config/solana/id.json");

    const payer = loadKeypairFromPath(PAYER_PATH);
    const connection = new Connection(RPC_URL, { commitment: "confirmed" });
    const name = "sLQD";
    const symbol = "sLQD";
    const uri = ""; // no metadata yet
    const initialSupply = 0; // unlimited supply pattern: mint authority can mint later
    console.log("RPC:", RPC_URL);
    console.log("Payer:", payer.publicKey.toBase58());

    // Create SPL mint with payer as mint and freeze authority
    const decimals = 9;
    const mintPubkey = await createMint(
      connection,
      payer,
      payer.publicKey,
      payer.publicKey,
      decimals
    );

    // Ensure payer has an ATA for reference and optional initial mint
    const payerAta = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintPubkey,
      payer.publicKey
    );

    let initialMintSig: string | null = null;
    if (initialSupply > 0) {
      initialMintSig = await mintTo(connection, payer, mintPubkey, payerAta.address, payer, initialSupply);
    }

    // Persist to json/slqd-mint.json
    const outDir = path.resolve(__dirname, "../..", "json");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "slqd-mint.json");
    const data = {
        name,
        symbol,
        uri,
        mint: mintPubkey.toBase58(),
        mintAuthority: payer.publicKey.toBase58(),
        freezeAuthority: payer.publicKey.toBase58(),
        payerAta: payerAta.address.toBase58(),
        tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
        initialMintSig,
        cluster: RPC_URL,
        createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
    console.log("Saved:", outPath);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});


