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
import idl from './idl/program.json'; // your program's IDL file
import { EventDecoder, BuyOrderCreated, SellOrderCreated } from './decoder';
import { Web3Service } from '../web3/web3.service';

@Injectable()
export class PoolingService {
  private readonly logger = new Logger(PoolingService.name);
  private readonly PROGRAM_ID: PublicKey;
  private readonly connection: Connection;

  constructor(
    private configService: ConfigService,
    private web3Service: Web3Service,
  ) {
    // Initialize the program ID from environment variable
    const programId = this.configService.get<string>('SPOUT_PROGRAM_ID');
    if (!programId) {
      throw new Error('SPOUT_PROGRAM_ID environment variable is required');
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
        { limit: 2 },
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
            try {
              const decodedOrder: BuyOrderCreated = EventDecoder.decodeBuyOrderCreated(evt.data);
              
              this.logger.log(
                `\nNEW BUY ORDER CREATED:\n` +
                `  User: ${decodedOrder.user.toString()}\n` +
                `  Ticker: ${decodedOrder.ticker}\n` +
                `  USDC Amount: ${decodedOrder.usdcAmount.toString()}\n` +
                `  Asset Amount: ${decodedOrder.assetAmount.toString()}\n` +
                `  Price: ${decodedOrder.price.toString()}\n` +
                `  Oracle Timestamp: ${new Date(decodedOrder.oracleTimestamp.toNumber() * 1000).toISOString()}\n` +
                `  Transaction: ${sigInfo.signature}`,
              );

              // Call mintToken function after logging
              await this.web3Service.mintToken(decodedOrder);
              
            } catch (error) {
              this.logger.error(`Failed to decode BuyOrderCreated event: ${error.message}`);
            }
          } 
          
          else if (evt.name === 'SellOrderCreated') {
            try {
              const decodedOrder: SellOrderCreated = EventDecoder.decodeSellOrderCreated(evt.data);
              
              this.logger.log(
                `\nNEW SELL ORDER CREATED:\n` +
                `  User: ${decodedOrder.user.toString()}\n` +
                `  Ticker: ${decodedOrder.ticker}\n` +
                `  USDC Amount: ${decodedOrder.usdcAmount.toString()}\n` +
                `  Asset Amount: ${decodedOrder.assetAmount.toString()}\n` +
                `  Price: ${decodedOrder.price.toString()}\n` +
                `  Oracle Timestamp: ${new Date(decodedOrder.oracleTimestamp.toNumber() * 1000).toISOString()}\n` +
                `  Transaction: ${sigInfo.signature}`,
              );

              // Call burnToken function after logging
              await this.web3Service.burnToken(decodedOrder);

            } catch (error) {
              this.logger.error(`Failed to decode SellOrderCreated event: ${error.message}`);
            }
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
