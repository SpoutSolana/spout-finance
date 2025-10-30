import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

// Event interfaces matching the Rust structs
export interface BuyOrderCreated {
  user: PublicKey;
  ticker: string;
  usdcAmount: BN;
  assetAmount: BN;
  price: BN;
  oracleTimestamp: BN;
}

export interface SellOrderCreated {
  user: PublicKey;
  ticker: string;
  usdcAmount: BN;
  assetAmount: BN;
  price: BN;
  oracleTimestamp: BN;
}

// Event decoder class
export class EventDecoder {
  /**
   * Decode BuyOrderCreated event data
   */
  static decodeBuyOrderCreated(data: any): BuyOrderCreated {
    return {
      user: new PublicKey(data.user),
      ticker: data.ticker,
      usdcAmount: new BN(data.usdcAmount || data.usdc_amount),
      assetAmount: new BN(data.assetAmount || data.asset_amount),
      price: new BN(data.price),
      oracleTimestamp: new BN(data.oracleTimestamp || data.oracle_timestamp),
    };
  }

  /**
   * Decode SellOrderCreated event data
   */
  static decodeSellOrderCreated(data: any): SellOrderCreated {
    return {
      user: new PublicKey(data.user),
      ticker: data.ticker,
      usdcAmount: new BN(data.usdcAmount || data.usdc_amount),
      assetAmount: new BN(data.assetAmount || data.asset_amount),
      price: new BN(data.price),
      oracleTimestamp: new BN(data.oracleTimestamp || data.oracle_timestamp),
    };
  }
}