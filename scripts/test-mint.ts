import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { readFileSync } from 'fs';

async function main() {
  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const PROGRAM_ID = new PublicKey('EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB');

  const payer = Keypair.fromSecretKey(
    new Uint8Array([227,57,226,193,103,32,190,14,91,51,133,96,149,134,131,77,184,237,7,195,99,50,47,12,102,32,4,190,49,192,247,244,151,169,36,215,229,28,34,160,198,236,236,166,52,235,16,159,45,165,228,89,58,52,35,226,151,250,219,38,24,217,178,35])
  );
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});
  const program = new Program(idl, provider);

  // Generate new mint
  const mint = Keypair.generate();
  console.log('Mint pubkey:', mint.publicKey.toBase58());

  // Derive PDAs
  const [programAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('program_authority'), mint.publicKey.toBuffer()],
    PROGRAM_ID
  );
  console.log('Program authority PDA:', programAuthorityPda.toBase58());

  const authority = payer.publicKey;
  const authorityAta = await getAssociatedTokenAddress(mint.publicKey, authority);
  console.log('Authority ATA:', authorityAta.toBase58());

  try {
    console.log('Attempting to initialize mint...');
    const tx = await program.methods
      .initializeKycMint("TestToken", "TEST", "https://example.com", new BN(0))
      .accounts({
        mint: mint.publicKey,
        authorityTokenAccount: authorityAta,
        programAuthority: programAuthorityPda,
        authority: authority,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
      })
      .signers([mint])
      .rpc();

    console.log('Success! Transaction:', tx);
  } catch (error: any) {
    console.error('Error details:', error);
    if (error.logs) {
      console.log('Transaction logs:', error.logs);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
