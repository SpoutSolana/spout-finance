import fs from "fs";
import bs58 from "bs58";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializePermanentDelegateInstruction,
  createInitializeMint2Instruction,
} from "@solana/spl-token";

const RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const PROGRAM_ID = new PublicKey("EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB");
const DECIMALS = 6;

async function main() {
  const connection = new Connection(RPC, "confirmed");

  // Load issuer payer
  const kpInfo = JSON.parse(fs.readFileSync("./json/keypair-info.json", "utf8"));
  const issuer = Keypair.fromSecretKey(bs58.decode(kpInfo.keypair.private_key_base58));

  // Create mint account with PermanentDelegate extension
  const mintKeypair = Keypair.generate();
  const mint = mintKeypair.publicKey;
  const mintLen = getMintLen([ExtensionType.PermanentDelegate]);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  // Derive program authority PDA used as permanent delegate
  const [programAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from("program_authority"), mint.toBuffer()],
    PROGRAM_ID,
  );

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: issuer.publicKey,
      newAccountPubkey: mint,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    // Initialize PermanentDelegate to programAuthority PDA
    createInitializePermanentDelegateInstruction(mint, programAuthority, TOKEN_2022_PROGRAM_ID),
    // Initialize Mint (mintAuthority = issuer for bootstrap; no freeze authority)
    createInitializeMint2Instruction(mint, DECIMALS, issuer.publicKey, null, TOKEN_2022_PROGRAM_ID),
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [issuer, mintKeypair], { commitment: "confirmed" });
  console.log("New sLQD-2022 mint:", mint.toBase58());
  console.log("Program Authority PDA:", programAuthority.toBase58());
  console.log("Create mint tx:", sig);

  // Save JSON
  fs.writeFileSync(
    "./json/slqd-mint-2022.json",
    JSON.stringify({ mint: mint.toBase58(), programAuthority: programAuthority.toBase58(), tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(), decimals: DECIMALS }, null, 2)
  );
}

main().catch((e) => { console.error(e); process.exit(1); });


