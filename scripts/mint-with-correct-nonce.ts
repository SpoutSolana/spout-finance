import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { readFileSync } from 'fs';

const RPC_URL = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('EkU7xRmBhVyHdwtRZ4SJ9D3Nz6SeAvymft7nz3CL2XXB');

function loadPayer(): Keypair {
  return Keypair.fromSecretKey(
    new Uint8Array([227,57,226,193,103,32,190,14,91,51,133,96,149,134,131,77,184,237,7,195,99,50,47,12,102,32,4,190,49,192,247,244,151,169,36,215,229,28,34,160,198,236,236,166,52,235,16,159,45,165,228,89,58,52,35,226,151,250,219,38,24,217,178,35])
  );
}

async function main() {
  console.log('🎯 FINAL: Minting with Correct Nonce');
  console.log('====================================');

  const payer = loadPayer();
  const connection = new Connection(RPC_URL, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});

  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const program = new Program(idl, provider);

  // Load the real attestation info we created
  const attestationInfo = JSON.parse(readFileSync('./real-attestation-for-minting.json', 'utf8'));

  // Use the mint we created earlier
  const mintAddress = new PublicKey('9hniP8NG32eDAzsKNQ2GGKo2Xij3vJvYKEkgW3Ejw6eb');
  console.log('Using mint:', mintAddress.toBase58());

  // Get the actual nonce from the attestation data
  const attestationAccount = new PublicKey(attestationInfo.attestation.pda);
  const accountInfo = await connection.getAccountInfo(attestationAccount);
  if (!accountInfo) {
    console.log('❌ Attestation account not found');
    return;
  }

  // Extract the nonce from the attestation data
  const data = accountInfo.data;
  let offset = 33 + 32 + 32; // Skip discriminator, credential, schema
  const nonce = new PublicKey(data.slice(offset, offset + 32));
  console.log('Actual nonce from attestation:', nonce.toBase58());

  // Use the nonce as the recipient (this is what the attestation was created for)
  const verifiedUser = nonce;
  console.log('Verified user (from nonce):', verifiedUser.toBase58());

  // PDAs
  const [programAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('program_authority'), mintAddress.toBuffer()],
    PROGRAM_ID
  );
  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config_v2')], PROGRAM_ID);

  const recipientTokenAccount = await getAssociatedTokenAddress(mintAddress, verifiedUser);
  console.log('Recipient token account:', recipientTokenAccount.toBase58());

  // Use REAL SAS accounts from attestation info
  const credentialAccount = new PublicKey(attestationInfo.attestation.credential);
  const schemaAccount = new PublicKey(attestationInfo.attestation.schema);
  const attestationAccountPda = new PublicKey(attestationInfo.attestation.pda);
  const sasProgram = new PublicKey(attestationInfo.attestation.sasProgram);

  console.log('\nSAS Account Details:');
  console.log('- Credential:', credentialAccount.toBase58());
  console.log('- Schema:', schemaAccount.toBase58());
  console.log('- Attestation:', attestationAccountPda.toBase58());
  console.log('- SAS Program:', sasProgram.toBase58());

  try {
    console.log('\n🚀 Creating mintToKycUser instruction for CORRECT nonce...');
    
    // Create the instruction manually using Anchor
    const instruction = await program.methods
      .mintToKycUser(verifiedUser, new BN(1000))
      .accounts({
        mint: mintAddress,
        recipientTokenAccount: recipientTokenAccount,
        attestationAccount: attestationAccountPda,
        schemaAccount: schemaAccount,
        credentialAccount: credentialAccount,
        sasProgram: sasProgram,
        programAuthority: programAuthorityPda,
        recipient: verifiedUser,
        issuer: payer.publicKey,
        config: configPda,
        payer: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
    
    console.log('✅ Instruction created successfully');
    console.log('Instruction data length:', instruction.data.length);
    console.log('Instruction discriminator:', Array.from(instruction.data.slice(0, 8)));
    
    // Send the transaction manually
    console.log('\n🚀 Sending transaction manually...');
    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(connection, transaction, [payer]);
    
    console.log('🎉 SUCCESS! Minted to CORRECT verified user!');
    console.log('Transaction:', signature);
    
    // Check token balance
    const balance = await connection.getTokenAccountBalance(recipientTokenAccount);
    console.log('Token balance:', balance.value.uiAmount, 'tokens');
    
    console.log('\n✅ COMPLETE SUCCESS!');
    console.log('- Real SAS attestation used ✅');
    console.log('- KYC verification passed ✅');
    console.log('- Tokens minted successfully ✅');
    console.log('- Backend CAN mint to verified participants! ✅');
    
  } catch (e: any) {
    console.log('❌ Error details:', e.message || e);
    
    if (e.message && e.message.includes('6004')) {
      console.log('\nKYC verification failed (Error 6004)');
      console.log('This means the attestation doesn\'t match the user.');
    } else if (e.message && e.message.includes('ConstraintAddress')) {
      console.log('\nSAS program address constraint failed.');
    } else {
      console.log('\nOther error occurred:', e.message || e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});