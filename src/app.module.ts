import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PoolingModule } from './modules/pooling/pooling.module';
import { Web3Module } from './modules/web3/web3.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PoolingModule, 
    Web3Module
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
