import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Connection, clusterApiUrl } from '@solana/web3.js';

@Injectable()
export class PoolingService {
  private readonly logger = new Logger(PoolingService.name);
  private connection: Connection;

  constructor() {
    // Connect to Solana devnet
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    this.logger.log('Solana Devnet polling service initialized');
  }

  @Cron('*/15 * * * * *') // Every 15 seconds
  async pollLatestBlockNumber() {
    try {
      const slot = await this.connection.getSlot();
      const blockTime = await this.connection.getBlockTime(slot);
      
      this.logger.log(`Latest Solana devnet block number (slot): ${slot}, Block time: ${blockTime ? new Date(blockTime * 1000).toISOString() : 'N/A'}`);
    } catch (error) {
      this.logger.error(`Error polling Solana devnet block number: ${error.message}`, error.stack);
    }
  }
}
