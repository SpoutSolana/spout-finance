import { Module } from '@nestjs/common';
import { PoolingService } from './pooling.service';
import { Web3Module } from '../web3/web3.module';

@Module({
  imports: [Web3Module],
  providers: [PoolingService],
  exports: [PoolingService]
})
export class PoolingModule {}
