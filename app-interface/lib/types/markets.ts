export interface StockData {
  ticker: string;
  name: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  volume: string;
  marketCap: string;
  dataSource?: string;
}

export interface MarketStats {
  label: string;
  value: string;
  icon: any; // Lucide icon component
}
