import pkg from '@coral-xyz/anchor';
const { BN, AnchorProvider, Program, setProvider } = pkg as any;
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import fs from 'fs';

async function main() {
  const provider = AnchorProvider.env();
  setProvider(provider);
  const wallet = provider.wallet as any;

  const idlRaw = JSON.parse(fs.readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  // Drop accounts to avoid anchor client size parsing issues
  const idl = { ...idlRaw, accounts: [] } as any;
  const programId = new PublicKey('EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB');
  const program = new Program(idl, programId, provider as any);

  const cfg = JSON.parse(fs.readFileSync('./json/slqd-mint-2022.json', 'utf8'));
  const mint = new PublicKey(cfg.mint);
  const programAuthority = new PublicKey(cfg.programAuthority);

  // Use known attested user as owner
  const owner = new PublicKey('Dd454fdtKRF5NEAbwCCVJnj8P4FroAD8Ei4dHRWUC4LW');
  const ownerAta = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);

  // Config PDA
  const [config] = PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId);

  const amount = new BN(1); // burn 1 token (decimals handled on-chain)

  const sig = await (program.methods as any)
    .burnFromKycUser(amount)
    .accounts({
      mint,
      owner,
      ownerTokenAccount: ownerAta,
      issuer: wallet.publicKey,
      config,
      programAuthority,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .rpc();

  console.log('Burn tx:', sig);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


