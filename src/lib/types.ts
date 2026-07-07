export interface BullflowStrike {
  strike: number;
  call_gex: number;
  put_gex: number;
  net_gex: number;
}

export interface BullflowExpiration {
  expiration: string;
  call_gex: number;
  put_gex: number;
  net_gex: number;
}

export interface BullflowGEXResponse {
  strikes: BullflowStrike[];
  expirations: BullflowExpiration[];
}

export interface PreviousSession {
  high: number;
  low: number;
  close: number;
  open: number;
}

export interface Quote {
  symbol: string;
  price: number;
  previousSession: PreviousSession;
}

export interface GEXLevel {
  type: string;
  strike: number;
  value: number;
  role: string;
  description: string;
}

export interface GEXAnalysis {
  spotPrice: number;
  totalNetGEX: number;
  gammaRegime: "positive" | "negative";
  levels: GEXLevel[];
  nearbyStrikes: BullflowStrike[];
  expirations: BullflowExpiration[];
}

export interface PivotLevel {
  method: string;
  label: string;
  value: number;
  role: string;
}

export interface OptimalPivot {
  price: number;
  score: number;
  role: "support" | "resistance" | "pivot" | "regime_boundary";
  sources: string[];
  recommendation: string;
}

export interface TradePlan {
  gammaRegime: string;
  spot: number;
  primaryPivot: OptimalPivot | null;
  nearestSupport: OptimalPivot | null;
  nearestResistance: OptimalPivot | null;
  bullishTrigger: number | null;
  bearishTrigger: number | null;
  strategy: string;
}

export interface AnalysisReport {
  ticker: string;
  asOf: string;
  quote: Quote;
  gexAnalysis: GEXAnalysis;
  traditionalPivots: PivotLevel[];
  optimalPivots: OptimalPivot[];
  tradePlan: TradePlan;
}