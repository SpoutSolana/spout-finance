import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { readFileSync } from 'fs';

// Configure these via env if desired
const RPC_URL = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB');
const NAME = process.env.MINT_NAME ?? 'spoutLQD';
const SYMBOL = process.env.MINT_SYMBOL ?? 'sLQD';
const URI = process.env.MINT_URI ?? 'https://example.com/spoutlqd.json';

function loadPayer(): Keypair {
  // Use the funded keypair
  return Keypair.fromSecretKey(
    new Uint8Array([227,57,226,193,103,32,190,14,91,51,133,96,149,134,131,77,184,237,7,195,99,50,47,12,102,32,4,190,49,192,247,244,151,169,36,215,229,28,34,160,198,236,236,166,52,235,16,159,45,165,228,89,58,52,35,226,151,250,219,38,24,217,178,35])
  );
}

async function main() {
  const payer = loadPayer();
  const connection = new Connection(RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});

  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const program = new Program(idl, provider);

  // New mint keypair
  const mint = Keypair.generate();

  // PDAs and ATAs
  const [programAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('program_authority'), mint.publicKey.toBuffer()],
    PROGRAM_ID
  );

  const authority = payer.publicKey; // issuer/authority
  const authorityAta = await getAssociatedTokenAddress(mint.publicKey, authority);

  console.log('Mint pubkey:', mint.publicKey.toBase58());
  console.log('Program authority PDA:', programAuthorityPda.toBase58());
  console.log('Authority ATA:', authorityAta.toBase58());

  const sig = await program.methods
    .initializeKycMint(NAME, SYMBOL, URI, new BN(0))
    .accounts({
      mint: mint.publicKey,
      authorityTokenAccount: authorityAta,
      programAuthority: programAuthorityPda,
      authority,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
    })
    .signers([mint])
    .rpc();

  console.log('initializeKycMint tx:', sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


