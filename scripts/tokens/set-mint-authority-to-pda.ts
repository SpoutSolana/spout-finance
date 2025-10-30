import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AuthorityType, setAuthority } from "@solana/spl-token";
import fs from "fs";

async function main() {
  const RPC_URL = process.env.RPC_URL || clusterApiUrl("devnet");
  const PAYER_PATH = process.env.PAYER_PATH || "./funded-keypair.json";

  const payer = Keypair.fromSecretKey(
    Uint8Array.from(JSON.parse(fs.readFileSync(PAYER_PATH, "utf8")))
  );
  const connection = new Connection(RPC_URL, { commitment: "confirmed" });

  const mint = new PublicKey(process.env.MINT!);
  const programId = new PublicKey("EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB");
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_authority"), mint.toBuffer()],
    programId
  );

  console.log("Mint:", mint.toBase58());
  console.log("New mint authority (PDA):", pda.toBase58());

  const sig = await setAuthority(
    connection,
    payer,
    mint,
    payer.publicKey,
    AuthorityType.MintTokens,
    pda
  );

  console.log("Set mint authority tx:", sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});



