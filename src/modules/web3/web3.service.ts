import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { clusterApiUrl, Connection, Keypair, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { AnchorProvider, Idl, Program, BN, Wallet } from '@coral-xyz/anchor';
import { BuyOrderCreated, SellOrderCreated } from '../pooling/decoder';
import rwaIdl from '../pooling/idl/program.json';

@Injectable()
export class Web3Service {
  private readonly logger = new Logger(Web3Service.name);
  private readonly credentialPda: PublicKey;
  private readonly schemaPda: PublicKey;
  private readonly sasProgramId: PublicKey;
  private readonly lqdPubkey: PublicKey;
  private readonly spoutProgramId: PublicKey;
  private readonly configPda: PublicKey;
  private readonly issuerKeypair: Keypair;
  private readonly connection: Connection;

  constructor(private configService: ConfigService) {
    // Initialize environment variables
    const credentialPdaStr = this.configService.get<string>('CREDENTIAL_PDA');
    const schemaPdaStr = this.configService.get<string>('SCHEMA_PDA');
    const sasProgramIdStr = this.configService.get<string>('SAS_PROGRAM_ID');
    const mintPubkeyStr = this.configService.get<string>('LQD_PUBKEY');
    const spoutProgramIdStr = this.configService.get<string>('SPOUT_PROGRAM_ID');
    const configPdaStr = this.configService.get<string>('CONFIG_PDA');
    const issuerKeypairStr = this.configService.get<string>('ISSUER_KEYPAIR');

    if (!credentialPdaStr || !schemaPdaStr || !sasProgramIdStr || !mintPubkeyStr || !spoutProgramIdStr || !configPdaStr || !issuerKeypairStr) {
      throw new Error('Required environment variables are missing: CREDENTIAL_PDA, SCHEMA_PDA, SAS_PROGRAM_ID, LQD_PUBKEY, RWA_PROGRAM_ID, SPOUT_PROGRAM_ID, CONFIG_PDA, ISSUER_KEYPAIR');
    }

    this.credentialPda = new PublicKey(credentialPdaStr);
    this.schemaPda = new PublicKey(schemaPdaStr);
    this.sasProgramId = new PublicKey(sasProgramIdStr);
    this.lqdPubkey = new PublicKey(mintPubkeyStr);
    this.spoutProgramId = new PublicKey(spoutProgramIdStr);
    this.configPda = new PublicKey(configPdaStr);
    
    // Parse the issuer keypair from base58 string
    const issuerKeypairArray = JSON.parse(issuerKeypairStr);
    this.issuerKeypair = Keypair.fromSecretKey(new Uint8Array(issuerKeypairArray));
    
    // Initialize Solana connection
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  }

  async mintToken(buyOrder: BuyOrderCreated): Promise<void> {
    try {
      const userPubkey = buyOrder.user;
      
      // Derive user attestation PDA
      const [userAttestationPda, ] = this.deriveUserAttestationPda(
        userPubkey,
        this.credentialPda,
        this.schemaPda,
        this.sasProgramId,
      );
      console.log(`User Attestation PDA: ${userAttestationPda.toString()}`);

      // Derive program authority PDA
      const [programAuthorityPda, ] = this.deriveProgramAuthorityPda(
        this.lqdPubkey,
        this.spoutProgramId,
      );
      console.log(`Program Authority PDA: ${programAuthorityPda.toString()}`);

      // Get user's associated token account (ATA)
      const userTokenAccount = this.getUserAssociatedTokenAddress(userPubkey);
      console.log(`User Token Account: ${userTokenAccount.toString()}`);

      // Minting RWA Token
      const wallet = new Wallet(this.issuerKeypair);
      const provider = new AnchorProvider(this.connection, wallet, {});
      const rwaIdlData = rwaIdl as unknown as Idl;
      const program = new Program(rwaIdlData, provider);
      
      // Log all values being passed to the mint function
      this.logger.log('🔍 Mint Parameters:');
      this.logger.log(`  User Pubkey: ${userPubkey.toString()}`);
      this.logger.log(`  Asset Amount: ${buyOrder.assetAmount}`);
      this.logger.log('📋 Accounts:');
      this.logger.log(`  Issuer: ${this.issuerKeypair.publicKey.toString()}`);
      this.logger.log(`  Config: ${this.configPda.toString()}`);
      this.logger.log(`  Mint: ${this.lqdPubkey.toString()}`);
      this.logger.log(`  Program Authority: ${programAuthorityPda.toString()}`);
      this.logger.log(`  Recipient Token Account: ${userTokenAccount.toString()}`);
      this.logger.log(`  Recipient: ${userPubkey.toString()}`);
      this.logger.log(`  Schema Account: ${this.schemaPda.toString()}`);
      this.logger.log(`  Credential Account: ${this.credentialPda.toString()}`);
      this.logger.log(`  Attestation Account: ${userAttestationPda.toString()}`);
      this.logger.log(`  SAS Program: ${this.sasProgramId.toString()}`);
      this.logger.log(`  Token Program: ${this.spoutProgramId.toString()}`);
      
      const tx = await program.methods
        .mint(userPubkey, buyOrder.assetAmount)
        .accounts({
          issuer: this.issuerKeypair.publicKey,
          config: this.configPda,
          mint: this.lqdPubkey,
          programAuthority: programAuthorityPda,
          recipientTokenAccount: userTokenAccount,
          recipient: userPubkey,
          schemaAccount: this.schemaPda,
          credentialAccount: this.credentialPda,
          attestationAccount: userAttestationPda,
          sasProgram: this.sasProgramId,
          tokenProgram: this.spoutProgramId,
        })
        .signers([this.issuerKeypair])
        .rpc();
      console.log(`Mint Transaction: ${tx}`);

      this.logger.log(`Mint operation completed for user: ${userPubkey.toString()}`);
    } catch (error) {
      this.logger.error(`Error in mintToken: ${error.message}`, error.stack);
      throw error;
    }
  }

  async burnToken(sellOrder: SellOrderCreated): Promise<void> {
    try {
      const userPubkey = sellOrder.user;
      
      // Derive user attestation PDA
      const [userAttestationPda, ] = this.deriveUserAttestationPda(
        userPubkey,
        this.credentialPda,
        this.schemaPda,
        this.sasProgramId,
      );
      console.log(`User Attestation PDA: ${userAttestationPda.toString()}`);

      // Derive program authority PDA
      const [programAuthorityPda, ] = this.deriveProgramAuthorityPda(
        this.lqdPubkey,
        this.spoutProgramId,
      );
      console.log(`Program Authority PDA: ${programAuthorityPda.toString()}`);

      // Get user's associated token account (ATA)
      const userTokenAccount = this.getUserAssociatedTokenAddress(userPubkey);
      console.log(`User Token Account: ${userTokenAccount.toString()}`);

      // Setup Anchor program
      const wallet = new Wallet(this.issuerKeypair);
      const provider = new AnchorProvider(this.connection, wallet, {});
      const rwaIdlData = rwaIdl as unknown as Idl;
      const program = new Program(rwaIdlData, provider);

      // Execute burn instruction
      const tx = await program.methods
      .burn(new BN(sellOrder.assetAmount.toString()))
      .accounts({
        issuer: this.issuerKeypair.publicKey,
        config: this.configPda,
        mint: this.lqdPubkey,
        programAuthority: programAuthorityPda,
        ownerTokenAccount: userTokenAccount,
        schemaAccount: this.schemaPda,
        credentialAccount: this.credentialPda,
        attestationAccount: userAttestationPda,
        sasProgram: this.sasProgramId,
        tokenProgram: this.spoutProgramId,
      })
      .signers([this.issuerKeypair])
      .rpc();

      this.logger.log(`🔥 Burn completed for user: ${userPubkey.toBase58()}`);

      this.logger.log(`User Attestation PDA: ${userAttestationPda.toString()}`);
            
    } catch (error) {
      this.logger.error(`Error in burnToken: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Derives the user attestation PDA
   */
  deriveUserAttestationPda(
    userPubkey: PublicKey,
    credentialPda: PublicKey,
    schemaPda: PublicKey,
    sasProgramId: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        credentialPda.toBuffer(),
        schemaPda.toBuffer(),
        userPubkey.toBuffer(),
      ],
      sasProgramId,
    );
  }

  /**
   * Derives the program authority PDA
   */
  deriveProgramAuthorityPda(mintPubkey: PublicKey, rwaProgramId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("program_authority"), mintPubkey.toBuffer()],
      rwaProgramId,
    );
  }

  /**
   * Gets the associated token address for a user
   */
  getUserAssociatedTokenAddress(userPubkey: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(
      this.lqdPubkey,
      userPubkey
    );
  }
}
