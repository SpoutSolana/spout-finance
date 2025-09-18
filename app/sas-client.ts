import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Spoutsolana } from '../target/types/spoutsolana';

export interface KycSchema {
  id: string;
  name: string;
  description: string;
  fields: KycField[];
}

export interface KycField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
}

export interface KycAttestation {
  holder: PublicKey;
  schemaId: string;
  issuer: PublicKey;
  issuedAt: Date;
  expiresAt?: Date;
  data: Record<string, any>;
}

export class SasClient {
  private connection: Connection;
  private provider: AnchorProvider;
  private program: Program<Spoutsolana>;

  constructor(
    connection: Connection,
    provider: AnchorProvider,
    program: Program<Spoutsolana>
  ) {
    this.connection = connection;
    this.provider = provider;
    this.program = program;
  }

  /**
   * Create a KYC schema for RWA assets
   */
  async createKycSchema(schema: KycSchema): Promise<string> {
    // This would integrate with SAS to create a schema
    // For now, return a mock schema ID
    console.log('Creating KYC schema:', schema);
    return `kyc_schema_${Date.now()}`;
  }

  /**
   * Issue a KYC attestation to a user
   */
  async issueKycAttestation(
    holder: PublicKey,
    schemaId: string,
    kycData: Record<string, any>
  ): Promise<string> {
    // This would integrate with SAS to issue an attestation
    // For now, return a mock attestation ID
    console.log('Issuing KYC attestation:', { holder, schemaId, kycData });
    return `attestation_${Date.now()}`;
  }

  /**
   * Verify a user's KYC status for an asset
   */
  async verifyKycForAsset(
    assetMint: PublicKey,
    holder: PublicKey
  ): Promise<boolean> {
    try {
      // Load config to get SAS program id
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        this.program.programId
      );
      const config = await this.program.account.config.fetch(configPda);

      // Get the asset account
      const [assetPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('asset'), assetMint.toBuffer()],
        this.program.programId
      );

      const assetAccount = await this.program.account.asset.fetch(assetPda);
      
      if (!assetAccount.kycRequired) {
        return true; // No KYC required
      }

      if (!assetAccount.kycSchemaId) {
        throw new Error('Asset requires KYC but no schema ID provided');
      }

      // Call our program's verify_kyc instruction
      await this.program.methods
        .verifyKyc({
          holder,
          schemaId: assetAccount.kycSchemaId,
        })
        .accounts({
          asset: assetPda,
          holder,
          sasProgram: new PublicKey(config.sasProgram),
        })
        .rpc();

      return true;
    } catch (error) {
      console.error('KYC verification failed:', error);
      return false;
    }
  }

  /**
   * Get all KYC attestations for a user
   */
  async getUserAttestations(holder: PublicKey): Promise<KycAttestation[]> {
    // This would query SAS for the user's attestations
    // For now, return mock data
    console.log('Getting attestations for user:', holder.toString());
    return [];
  }

  /**
   * Create an asset with KYC requirements
   */
  async createAssetWithKyc(
    mint: PublicKey,
    name: string,
    symbol: string,
    totalSupply: number,
    kycRequired: boolean = true,
    kycSchemaId?: string
  ): Promise<string> {
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      this.program.programId
    );

    const [assetPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('asset'), mint.toBuffer()],
      this.program.programId
    );

    const tx = await this.program.methods
      .createAsset({
        name,
        symbol,
        totalSupply: new anchor.BN(totalSupply),
        kycRequired,
        kycSchemaId: kycSchemaId || null,
      })
      .accounts({
        config: configPda,
        asset: assetPda,
        mint,
        authority: this.provider.wallet.publicKey,
        payer: this.provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    return tx;
  }
}

// Example usage and helper functions
export const createDefaultKycSchema = (): KycSchema => ({
  id: 'rwa_kyc_v1',
  name: 'RWA KYC Verification',
  description: 'Standard KYC verification for Real World Assets',
  fields: [
    { name: 'fullName', type: 'string', required: true },
    { name: 'dateOfBirth', type: 'date', required: true },
    { name: 'country', type: 'string', required: true },
    { name: 'isAccredited', type: 'boolean', required: true },
    { name: 'riskLevel', type: 'string', required: true },
  ],
});

export const createKycData = (userInfo: {
  fullName: string;
  dateOfBirth: string;
  country: string;
  isAccredited: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}): Record<string, any> => ({
  fullName: userInfo.fullName,
  dateOfBirth: userInfo.dateOfBirth,
  country: userInfo.country,
  isAccredited: userInfo.isAccredited,
  riskLevel: userInfo.riskLevel,
  verifiedAt: new Date().toISOString(),
});

