import { Module } from '@nestjs/common';
import { Web3Service } from './web3.service';
import { UserAttestationService } from './user-attestation.service';
import { Web3Controller } from './web3.controller';

@Module({
  controllers: [Web3Controller],
  providers: [Web3Service, UserAttestationService],
  exports: [Web3Service, UserAttestationService]
})
export class Web3Module {}
