import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  Connection,
  clusterApiUrl,
  PublicKey,
} from '@solana/web3.js';
import {
  AnchorProvider,
  Idl,
  Program,
  BorshCoder,
  EventParser,
} from '@coral-xyz/anchor';
import idl from './idl/order_program.json'; // your program's IDL file

@Injectable()
export class PoolingService {
  private readonly logger = new Logger(PoolingService.name);
  private readonly PROGRAM_ID: PublicKey;
  private readonly connection: Connection;

  constructor(private configService: ConfigService) {
    // Initialize the program ID from environment variable
    const programId = this.configService.get<string>('ORDERS_PROGRAM_ID');
    if (!programId) {
      throw new Error('ORDERS_PROGRAM_ID environment variable is required');
    }
    this.PROGRAM_ID = new PublicKey(programId);

    // Step 1. Initialize connection to Solana devnet
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    this.logger.log('Solana polling service initialized');
    this.logger.log(`Using program ID: ${this.PROGRAM_ID.toString()}`);
  }

  @Cron('*/15 * * * * *') // Run every 15 seconds
  async pollForOrderEvents() {
    try {
      this.logger.log('Polling Solana program events...');

      // Step 2. Create Provider
      const provider = new AnchorProvider(this.connection, {} as any, {});

      // Step 3. Get IDL
      const idlData = idl as unknown as Idl;
      if (!idlData) {
        this.logger.error(`No IDL found for program ${this.PROGRAM_ID.toString()}`);
        return;
      }

      // Step 4. Initialize Program, Coder, and Parser
      const program = new Program(idlData, provider);
      const coder = new BorshCoder(idlData);
      const parser = new EventParser(this.PROGRAM_ID, coder);

      // Step 5. Fetch recent transaction signatures
      const signatures = await provider.connection.getSignaturesForAddress(
        this.PROGRAM_ID,
        { limit: 5 },
      );

      console.log("Fetched signatures:", signatures.length);

      // Step 6. Loop through each transaction
      for (const sigInfo of signatures) {
        const tx = await provider.connection.getTransaction(sigInfo.signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });

        if (!tx?.meta?.logMessages) continue;
        const events = parser.parseLogs(tx.meta.logMessages);

        for (const evt of events) {
          if (evt.name === 'BuyOrderCreated') {
            this.logger.log(`Buy order: ${JSON.stringify(evt.data)}`);
            // TODO: store evt.data in DB
          } else if (evt.name === 'SellOrderCreated') {
            this.logger.log(`Sell order: ${JSON.stringify(evt.data)}`);
            // TODO: store evt.data in DB
          }
        }
      }

      this.logger.log('Poll cycle complete');
    } catch (error) {
      this.logger.error(
        `Error while polling Solana order events: ${error.message}`,
        error.stack,
      );
    }
  }
}
