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

  // Use the mint we just created
  const mintAddress = new PublicKey('9hniP8NG32eDAzsKNQ2GGKo2Xij3vJvYKEkgW3Ejw6eb');
  console.log('Using mint:', mintAddress.toBase58());

  // Create a test user
  const testUser = Keypair.generate();
  console.log('Test user:', testUser.publicKey.toBase58());

  // Derive PDAs
  const [programAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('program_authority'), mintAddress.toBuffer()],
    PROGRAM_ID
  );
  console.log('Program authority PDA:', programAuthorityPda.toBase58());

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config_v2')], PROGRAM_ID);
  console.log('Config PDA:', configPda.toBase58());

  const recipientTokenAccount = await getAssociatedTokenAddress(mintAddress, testUser.publicKey);
  console.log('Recipient token account:', recipientTokenAccount.toBase58());

  // Mock SAS accounts (for now, just use dummy addresses)
  const credentialAccount = new PublicKey('B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL');
  const schemaAccount = new PublicKey('B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL');
  const attestationAccount = new PublicKey('B4PtmaDJdFQBxpvwdLB3TDXuLd69wnqXexM2uBqqfMXL');
  const sasProgram = new PublicKey('11111111111111111111111111111111'); // System program as placeholder

  try {
    console.log('Attempting to mint to user...');
    const tx = await program.methods
      .mintToKycUser(testUser.publicKey, new BN(1000)) // 1000 tokens
      .accounts({
        mint: mintAddress,
        recipientTokenAccount: recipientTokenAccount,
        attestationAccount: attestationAccount,
        schemaAccount: schemaAccount,
        credentialAccount: credentialAccount,
        sasProgram: sasProgram,
        programAuthority: programAuthorityPda,
        recipient: testUser.publicKey,
        issuer: payer.publicKey,
        config: configPda,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([payer])
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
