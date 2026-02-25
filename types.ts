
export enum ScenarioType {
  OPTIMISTIC = 'OPTIMISTIC',
  REALISTIC = 'REALISTIC',
  PESSIMISTIC = 'PESSIMISTIC'
}

export interface SimulationInputs {
  // Commission Variables
  firstMonthCommission: number; // Percentage
  recurringCommission: number; // Percentage
  upfrontFeePerPartner: number; // Fixed SAR fee per partner

  // Price Variables
  avgSubscriptionPrice: number; // SAR
  influencerDiscount: number; // Percentage

  // Customer Behavior
  conversionRate: number; // Percentage
  churnRate: number; // Monthly percentage
  avgRetentionMonths: number;
  refundRate: number; // Percentage

  // Operational Variables
  infraCostPerUser: number; // SAR per month
  paymentGatewayFee: number; // Percentage
  supportCostPerUser: number; // SAR per month

  // Growth
  partnerCount: number;
  avgReferralsPerPartner: number;
}

export interface CostItem {
  id: string;
  name: string;
  amount: number;
  type: 'fixed' | 'variable';
}

export interface CapitalCostItem {
  id: string;
  name: string;
  amount: number;
  usefulLife: number; // in months
  purchaseDate: string;
  salvageValue: number;
  category: 'equipment' | 'furniture' | 'technology' | 'infrastructure' | 'other';
}

export type CurrencyType = 'SAR' | 'USD';

export interface CurrencySettings {
  currency: CurrencyType;
  exchangeRate: number; // 1 USD = X SAR
}

export interface Settings {
  monthlyFixedCosts: CostItem[];
  capitalCosts: CapitalCostItem[];
  currency: CurrencySettings;
}

export interface SimulationMetrics {
  cac: number;
  ltv: number;
  grossMargin: number;
  grossMarginPercentage: number;
  paybackPeriod: number;
  breakEvenSubscribers: number;
  expectedProfit3Months: number;
  expectedProfit6Months: number;
  expectedProfit12Months: number;
  totalSubscribers: number;
  totalRevenue: number;
  totalMonthlyFixedCosts: number;
  totalMonthlyDepreciation: number;
  totalCapitalInvestment: number;
  netProfit3Months: number;
  netProfit6Months: number;
  netProfit12Months: number;
}

export interface RiskIndicator {
  label: string;
  value: string | number;
  status: 'safe' | 'warning' | 'danger';
  description: string;
}
