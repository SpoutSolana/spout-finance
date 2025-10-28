import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { readFileSync } from 'fs';

async function main() {
  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const PROGRAM_ID = new PublicKey('EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB');

  const payer = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(readFileSync('./target/deploy/spoutsolana-keypair.json', 'utf8')))
  );
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});
  const program = new Program(idl, provider);

  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
  const authority = new PublicKey(process.env.AUTHORITY ?? payer.publicKey.toBase58());

  console.log('Config PDA:', configPda.toBase58());
  console.log('Authority:', authority.toBase58());

  const sig = await program.methods
    .initializeConfig(authority)
    .accounts({
      config: configPda,
      payer: payer.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([payer])
    .rpc();

  console.log('Initialized config. Tx:', sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


