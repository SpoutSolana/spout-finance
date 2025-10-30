import pkg from '@coral-xyz/anchor';
const { AnchorProvider, Program, setProvider, BN } = pkg as any;
import { PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import fs from 'fs';

async function main() {
  const provider = AnchorProvider.env();
  setProvider(provider);
  const wallet = provider.wallet as any;

  const idl = JSON.parse(fs.readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const programId = new PublicKey('EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB');
  const program = new Program(idl, programId, provider as any);

  const cfg = JSON.parse(fs.readFileSync('./json/slqd-mint-2022.json', 'utf8'));
  const mint = new PublicKey(cfg.mint);
  const programAuthority = new PublicKey(cfg.programAuthority);

  const recipient = new PublicKey('Dd454fdtKRF5NEAbwCCVJnj8P4FroAD8Ei4dHRWUC4LW');
  const recipientAta = getAssociatedTokenAddressSync(mint, recipient, false, TOKEN_2022_PROGRAM_ID);

  // SAS setup (schema, credential, attestation). Adjust as needed to match your deployed SAS data
  const sasProgram = new PublicKey('SAS111111111111111111111111111111111111111'); // placeholder if unused by verification
  const schemaAccount = new PublicKey(JSON.parse(fs.readFileSync('./schema-info.json','utf8')).schemaPda || '11111111111111111111111111111111');
  const credentialAccount = new PublicKey(JSON.parse(fs.readFileSync('./schema-info.json','utf8')).credentialPda || '11111111111111111111111111111111');
  const attestationAccount = new PublicKey(JSON.parse(fs.readFileSync('./schema-info.json','utf8')).attestationPda || '11111111111111111111111111111111');

  const [config] = PublicKey.findProgramAddressSync([Buffer.from('config')], program.programId);

  const sig = await (program.methods as any)
    .mintToKycUser2022(recipient, new BN(10))
    .accounts({
      mint,
      recipientTokenAccount: recipientAta,
      attestationAccount,
      schemaAccount,
      credentialAccount,
      sasProgram,
      programAuthority,
      recipient,
      issuer: wallet.publicKey,
      config,
      payer: wallet.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
      systemProgram: new PublicKey('11111111111111111111111111111111'),
    })
    .rpc();

  console.log('Mint-2022 tx:', sig);
}

main().catch((e) => { console.error(e); process.exit(1); });
