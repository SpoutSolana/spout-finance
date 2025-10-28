import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
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

  console.log('Program ID:', PROGRAM_ID.toBase58());
  console.log('Payer:', payer.publicKey.toBase58());
  console.log('Program loaded successfully!');

  // Test if we can call a simple method
  try {
    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
    console.log('Config PDA:', configPda.toBase58());
    
    // Try to fetch the config account
    const configAccount = await program.account.config.fetch(configPda);
    console.log('Config account:', configAccount);
  } catch (e) {
    console.log('Config account not found or error:', e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
