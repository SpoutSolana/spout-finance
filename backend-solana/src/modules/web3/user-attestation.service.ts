import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Keypair, PublicKey, Transaction, clusterApiUrl, sendAndConfirmTransaction } from '@solana/web3.js';
import { createSolanaClient } from 'gill';
import {
  getCreateAttestationInstruction,
  serializeAttestationData,
  fetchSchema,
  deriveAttestationPda,
  SOLANA_ATTESTATION_SERVICE_PROGRAM_ADDRESS,
} from 'sas-lib';

export interface AttestUserDto {
  userPubkey: string;
  attestationData?: Record<string, any>;
}

export interface AttestUserResponse {
  attestationPda: string;
  transactionSignature: string;
  success: boolean;
}

@Injectable()
export class UserAttestationService {
  private readonly logger = new Logger(UserAttestationService.name);
  private readonly credentialPda: PublicKey;
  private readonly schemaPda: PublicKey;
  private readonly sasProgramId: PublicKey;
  private readonly issuerKeypair: Keypair;
  private readonly connection: Connection;
  private readonly client: any;

  constructor(private configService: ConfigService) {
    // Initialize environment variables
    const credentialPdaStr = this.configService.get<string>('CREDENTIAL_PDA');
    const schemaPdaStr = this.configService.get<string>('SCHEMA_PDA');
    const sasProgramIdStr = this.configService.get<string>('SAS_PROGRAM_ID');
    const issuerKeypairStr = this.configService.get<string>('ISSUER_KEYPAIR');
    const rpcUrl = this.configService.get<string>('SOLANA_RPC_URL', 'https://api.devnet.solana.com');

    if (!credentialPdaStr || !schemaPdaStr || !sasProgramIdStr || !issuerKeypairStr) {
      throw new Error('Required environment variables are missing: CREDENTIAL_PDA, SCHEMA_PDA, SAS_PROGRAM_ID, ISSUER_KEYPAIR');
    }

    this.credentialPda = new PublicKey(credentialPdaStr);
    this.schemaPda = new PublicKey(schemaPdaStr);
    this.sasProgramId = new PublicKey(sasProgramIdStr);
    
    // Parse the issuer keypair from JSON array format
    const issuerKeypairArray = JSON.parse(issuerKeypairStr);
    this.issuerKeypair = Keypair.fromSecretKey(new Uint8Array(issuerKeypairArray));
    
    // Initialize Solana connection and client
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    this.client = createSolanaClient({ urlOrMoniker: rpcUrl });
  }

  /**
   * Attests a user by creating an attestation on-chain
   */
  async attestUser(attestRequest: AttestUserDto): Promise<AttestUserResponse> {
    try {
      const userPubkey = new PublicKey(attestRequest.userPubkey);
      
      this.logger.log(`Starting attestation for user: ${userPubkey.toString()}`);

      // Derive attestation PDA
      const [attestationPdaRaw] = await deriveAttestationPda({
        credential: this.credentialPda.toBase58() as any,
        schema: this.schemaPda.toBase58() as any,
        nonce: userPubkey.toBase58() as any,
      });
      const attestationPda = new PublicKey(attestationPdaRaw as any);

      this.logger.log(`Attestation PDA: ${attestationPda.toString()}`);

      // Fetch schema for data serialization
      const schema = await fetchSchema(this.client.rpc, this.schemaPda.toBase58() as any);
      this.logger.log(`Schema fetched successfully`);

      // Default attestation data (can be customized via request)
      const defaultAttestationData = { kycCompleted: 1 };
      const attestationData = attestRequest.attestationData || defaultAttestationData;
      
      // Set expiry to 1 year from now
      const EXPIRY_SECONDS = 365 * 24 * 60 * 60;
      const expiryTs = Math.floor(Date.now() / 1000) + EXPIRY_SECONDS;

      this.logger.log(`Attestation data: ${JSON.stringify(attestationData)}`);
      this.logger.log(`Expiry timestamp: ${expiryTs}`);

      // Create attestation instruction
      const ixSas = await getCreateAttestationInstruction({
        payer: this.issuerKeypair as any,
        authority: this.issuerKeypair as any,
        credential: this.credentialPda.toBase58() as any,
        schema: this.schemaPda.toBase58() as any,
        attestation: attestationPda.toBase58() as any,
        nonce: userPubkey.toBase58() as any,
        expiry: expiryTs,
        data: serializeAttestationData(schema.data, attestationData),
      });

      // Convert sas-lib instruction to web3.js instruction
      const web3Ix = this.convertSasInstructionToWeb3(ixSas);

      // Create and send transaction
      const transaction = new Transaction().add(web3Ix);
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [this.issuerKeypair],
        { commitment: 'confirmed' }
      );

      this.logger.log(`Attestation created successfully`);
      this.logger.log(`  Transaction: ${signature}`);
      this.logger.log(`  Attestation PDA: ${attestationPda.toBase58()}`);

      return {
        attestationPda: attestationPda.toBase58(),
        transactionSignature: signature,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error in attestUser: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Checks if a user has a valid attestation
   */
  async getUserAttestationStatus(userPubkey: string): Promise<{
    hasAttestation: boolean;
    attestationPda?: string;
    attestationData?: any;
  }> {
    try {
      const userPublicKey = new PublicKey(userPubkey);
      
      // Derive attestation PDA
      const [attestationPdaRaw] = await deriveAttestationPda({
        credential: this.credentialPda.toBase58() as any,
        schema: this.schemaPda.toBase58() as any,
        nonce: userPublicKey.toBase58() as any,
      });
      const attestationPda = new PublicKey(attestationPdaRaw as any);

      // Check if attestation account exists
      const accountInfo = await this.connection.getAccountInfo(attestationPda);
      
      if (accountInfo) {
        // TODO: Parse attestation data from account info if needed
        return {
          hasAttestation: true,
          attestationPda: attestationPda.toBase58(),
          attestationData: null, // Would need to decode based on schema
        };
      } else {
        return {
          hasAttestation: false,
        };
      }
    } catch (error) {
      this.logger.error(`Error checking attestation status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Derives the user attestation PDA (compatible with Web3Service)
   */
  deriveUserAttestationPda(
    userPubkey: PublicKey,
    credentialPda: PublicKey,
    schemaPda: PublicKey,
    sasProgramId: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('attestation'),
        credentialPda.toBuffer(),
        schemaPda.toBuffer(),
        userPubkey.toBuffer(),
      ],
      sasProgramId,
    );
  }

  /**
   * Converts sas-lib instruction format to web3.js instruction format
   * This handles the complex address conversion from the original script
   */
  private convertSasInstructionToWeb3(ixSas: any): any {
    // Helper function to convert various address formats to PublicKey
    const toPubkey = (addr: any): PublicKey => {
      if (addr instanceof PublicKey) return addr;
      if (typeof addr === 'string') return new PublicKey(addr);
      if (addr && typeof addr.toBase58 === 'function') return new PublicKey(addr.toBase58());
      if (addr && addr.publicKey) {
        const pk = addr.publicKey;
        if (pk instanceof PublicKey) return pk;
        if (typeof pk.toBase58 === 'function') return new PublicKey(pk.toBase58());
        if (pk?.data) {
          const bytes = Array.isArray(pk.data) ? Uint8Array.from(pk.data) : Uint8Array.from(pk.data.data ?? pk.data);
          return new PublicKey(bytes);
        }
      }
      if (addr && addr._keypair?.publicKey?.data) {
        const data: any = addr._keypair.publicKey.data;
        const bytes = Array.isArray(data) ? Uint8Array.from(data) : Uint8Array.from(data.data ?? data);
        return new PublicKey(bytes);
      }
      if (Array.isArray(addr)) return new PublicKey(Uint8Array.from(addr));
      if (addr && typeof addr === 'object') {
        const vals = Object.values(addr);
        if (vals.every((v) => typeof v === 'number')) return new PublicKey(Uint8Array.from(vals as number[]));
      }
      throw new Error('Unsupported address format in sas-lib account');
    };

    const programId = toPubkey(ixSas.programAddress);
    const keys: any[] = [];

    for (const [idx, a] of (ixSas.accounts as any[]).entries()) {
      try {
        const pubkey = toPubkey(a.address);
        const isWritable = a.role === 1 || a.isWritable === true;
        const isSigner = a.isSigner === true || pubkey.equals(this.issuerKeypair.publicKey);
        keys.push({ pubkey, isSigner, isWritable });
      } catch (e) {
        this.logger.error(`Account conversion failed at index ${idx}`, { value: a });
        throw e;
      }
    }

    const data = Buffer.from(Object.values(ixSas.data) as number[]);

    return { programId, keys, data };
  }
}
