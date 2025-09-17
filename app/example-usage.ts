import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Spoutsolana } from '../target/types/spoutsolana';
import { SasClient, createDefaultKycSchema, createKycData } from './sas-client';

/**
 * Example: Complete RWA issuance with KYC/AML using Solana Attestation Service
 */
async function exampleRwaIssuanceWithKyc() {
  // Setup connection and provider
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = new Wallet(Keypair.generate());
  const provider = new AnchorProvider(connection, wallet, {});
  
  // Load the program
  const program = new Program<Spoutsolana>(
    require('../target/idl/spoutsolana.json'),
    provider
  );

  // Initialize SAS client
  const sasClient = new SasClient(connection, provider, program);

  try {
    // Step 1: Initialize the RWA program
    console.log('Step 1: Initializing RWA program...');
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      program.programId
    );

    await program.methods
      .initialize({ authority: wallet.publicKey })
      .accounts({
        config: configPda,
        payer: wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    // Step 2: Create KYC schema
    console.log('Step 2: Creating KYC schema...');
    const kycSchema = createDefaultKycSchema();
    const schemaId = await sasClient.createKycSchema(kycSchema);
    console.log('Created KYC schema:', schemaId);

    // Step 3: Create RWA asset with KYC requirements
    console.log('Step 3: Creating RWA asset...');
    const mint = Keypair.generate();
    const assetTx = await sasClient.createAssetWithKyc(
      mint.publicKey,
      'Corporate Bond 2024',
      'CB2024',
      10_000_000, // 10M tokens
      true, // KYC required
      schemaId
    );
    console.log('Created asset transaction:', assetTx);

    // Step 4: Simulate KYC verification for a user
    console.log('Step 4: Simulating KYC verification...');
    const userWallet = Keypair.generate();
    
    // Create KYC data for the user
    const kycData = createKycData({
      fullName: 'John Doe',
      dateOfBirth: '1990-01-01',
      country: 'US',
      isAccredited: true,
      riskLevel: 'low'
    });

    // Issue KYC attestation (this would integrate with SAS)
    const attestationId = await sasClient.issueKycAttestation(
      userWallet.publicKey,
      schemaId,
      kycData
    );
    console.log('Issued KYC attestation:', attestationId);

    // Step 5: Verify KYC for asset access
    console.log('Step 5: Verifying KYC for asset access...');
    const isKycVerified = await sasClient.verifyKycForAsset(
      mint.publicKey,
      userWallet.publicKey
    );
    console.log('KYC verification result:', isKycVerified);

    if (isKycVerified) {
      console.log('✅ User is verified and can access the RWA asset');
    } else {
      console.log('❌ User failed KYC verification');
    }

  } catch (error) {
    console.error('Error in RWA issuance flow:', error);
  }
}

/**
 * Example: Batch KYC verification for multiple users
 */
async function exampleBatchKycVerification() {
  const connection = new Connection('https://api.devnet.solana.com');
  const wallet = new Wallet(Keypair.generate());
  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program<Spoutsolana>(
    require('../target/idl/spoutsolana.json'),
    provider
  );
  const sasClient = new SasClient(connection, provider, program);

  const users = [
    { name: 'Alice', isAccredited: true, riskLevel: 'low' as const },
    { name: 'Bob', isAccredited: false, riskLevel: 'medium' as const },
    { name: 'Charlie', isAccredited: true, riskLevel: 'high' as const },
  ];

  const mint = Keypair.generate();
  
  // Create asset
  await sasClient.createAssetWithKyc(
    mint.publicKey,
    'Real Estate Token',
    'RET',
    1_000_000,
    true,
    'rwa_kyc_v1'
  );

  // Verify KYC for each user
  for (const user of users) {
    const userWallet = Keypair.generate();
    const kycData = createKycData({
      fullName: user.name,
      dateOfBirth: '1985-01-01',
      country: 'US',
      isAccredited: user.isAccredited,
      riskLevel: user.riskLevel
    });

    await sasClient.issueKycAttestation(userWallet.publicKey, 'rwa_kyc_v1', kycData);
    
    const isVerified = await sasClient.verifyKycForAsset(mint.publicKey, userWallet.publicKey);
    console.log(`${user.name}: KYC ${isVerified ? '✅' : '❌'}`);
  }
}

// Export for use in other modules
export {
  exampleRwaIssuanceWithKyc,
  exampleBatchKycVerification
};

