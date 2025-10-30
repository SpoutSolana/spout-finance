import * as anchor from '@coral-xyz/anchor';
import { Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import fs from 'fs';

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  const idl = JSON.parse(fs.readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const programId = new PublicKey('EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB');
  const program = new anchor.Program(idl, programId, provider);

  const mint = Keypair.generate();
  const [programAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('program_authority'), mint.publicKey.toBuffer()],
    program.programId,
  );

  const name = 'sLQD-2022';
  const symbol = 'sLQD';
  const uri = '';
  const initialSupply = new anchor.BN(0);

  await program.methods
    .initializeKycMint2022(name, symbol, uri, initialSupply)
    .accounts({
      mint: mint.publicKey,
      programAuthority,
      authority: wallet.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      systemProgram: SystemProgram.programId,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    })
    .signers([mint])
    .rpc();

  const out = {
    mint: mint.publicKey.toBase58(),
    programAuthority: programAuthority.toBase58(),
    tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58(),
  };
  fs.writeFileSync('./json/slqd-mint-2022.json', JSON.stringify(out, null, 2));
  console.log('Initialized Token-2022 mint with PermanentDelegate:', out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


