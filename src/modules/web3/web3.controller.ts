import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  HttpException, 
  HttpStatus,
  Logger 
} from '@nestjs/common';
import { UserAttestationService } from './user-attestation.service';
import type { AttestUserDto, AttestUserResponse } from './user-attestation.service';

@Controller('web3')
export class Web3Controller {
  private readonly logger = new Logger(Web3Controller.name);

  constructor(
    private readonly userAttestationService: UserAttestationService,
  ) {}

  /**
   * Attest a user by creating an on-chain attestation
   */
  @Post('attest-user')
  async attestUser(@Body() attestUserDto: AttestUserDto): Promise<AttestUserResponse> {
    try {
      this.logger.log(`Received attest user request for: ${attestUserDto.userPubkey}`);
      
      if (!attestUserDto.userPubkey) {
        throw new HttpException('userPubkey is required', HttpStatus.BAD_REQUEST);
      }

      const result = await this.userAttestationService.attestUser(attestUserDto);
      
      this.logger.log(`Attestation completed successfully for: ${attestUserDto.userPubkey}`);
      return result;
    } catch (error) {
      this.logger.error(`Error attesting user: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to attest user: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check if a user has a valid attestation
   */
  @Get('attestation-status/:userPubkey')
  async getAttestationStatus(@Param('userPubkey') userPubkey: string) {
    try {
      this.logger.log(`Checking attestation status for: ${userPubkey}`);
      
      if (!userPubkey) {
        throw new HttpException('userPubkey is required', HttpStatus.BAD_REQUEST);
      }

      const status = await this.userAttestationService.getUserAttestationStatus(userPubkey);
      
      this.logger.log(`Attestation status check completed for: ${userPubkey}`);
      return status;
    } catch (error) {
      this.logger.error(`Error checking attestation status: ${error.message}`, error.stack);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to check attestation status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check endpoint for Web3 module
   */
  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      module: 'web3',
      timestamp: new Date().toISOString(),
    };
  }
}