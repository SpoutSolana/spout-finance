import { AnchorProvider, Program, Wallet, BN } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { readFileSync } from 'fs';

function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as number[];
  return Keypair.fromSecretKey(new Uint8Array(raw));
}

async function testBasicFunctionality() {
  console.log('🧪 Testing Basic Program Functionality');
  console.log('=====================================');
  
  const rpcUrl = process.env.RPC_URL ?? 'https://api.devnet.solana.com';
  const payerPath = process.env.PAYER_PATH ?? './funded-keypair.json';
  
  const payer = loadKeypair(payerPath);
  const connection = new Connection(rpcUrl, 'confirmed');
  const provider = new AnchorProvider(connection, new Wallet(payer), {});
  
  const idl = JSON.parse(readFileSync('./target/idl/spoutsolana.json', 'utf8'));
  const program = new Program(idl as any, provider as any);
  
  console.log('✅ Program loaded successfully');
  console.log('Program ID:', program.programId.toBase58());
  console.log('Payer:', payer.publicKey.toBase58());
  
  // Test 1: Initialize config
  console.log('\n📋 Test 1: Initialize Config');
  try {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      program.programId
    );
    
    console.log('Config PDA:', configPda.toBase58());
    
    // Check if config already exists
    const configAccount = await connection.getAccountInfo(configPda);
    if (configAccount) {
      console.log('✅ Config already initialized');
    } else {
      console.log('⚠️  Config not initialized - would need to call initialize_config');
    }
  } catch (error) {
    console.error('❌ Config test failed:', error);
  }
  
  // Test 2: Check available instructions
  console.log('\n📋 Test 2: Available Instructions');
  const instructions = idl.instructions.map((ix: any) => ix.name);
  console.log('Available instructions:', instructions);
  
  // Test 3: Check events
  console.log('\n📋 Test 3: Available Events');
  const events = idl.events.map((evt: any) => evt.name);
  console.log('Available events:', events);
  
  console.log('\n✅ Basic functionality test completed');
}

async function main() {
  try {
    await testBasicFunctionality();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
