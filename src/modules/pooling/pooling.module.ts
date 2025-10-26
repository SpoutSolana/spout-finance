import { Module } from '@nestjs/common';
import { PoolingService } from './pooling.service';

@Module({
  providers: [PoolingService],
  exports: [PoolingService]
})
export class PoolingModule {}
