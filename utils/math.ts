
import { SimulationInputs, SimulationMetrics, CostItem, CapitalCostItem } from '../types';

export const calculateMonthlyFixedCosts = (costItems: CostItem[]): number => {
  return costItems.reduce((sum, item) => sum + item.amount, 0);
};

export const calculateMonthlyDepreciation = (capitalCosts: CapitalCostItem[]): number => {
  return capitalCosts.reduce((sum, item) => {
    const depreciableAmount = item.amount - item.salvageValue;
    const monthlyDepreciation = depreciableAmount / item.usefulLife;
    return sum + monthlyDepreciation;
  }, 0);
};

export const calculateTotalCapitalInvestment = (capitalCosts: CapitalCostItem[]): number => {
  return capitalCosts.reduce((sum, item) => sum + item.amount, 0);
};

export const calculateMetrics = (
  inputs: SimulationInputs,
  monthlyFixedCosts: number = 0,
  monthlyDepreciation: number = 0,
  totalCapitalInvestment: number = 0
): SimulationMetrics => {
  const {
    firstMonthCommission,
    recurringCommission,
    upfrontFeePerPartner,
    avgSubscriptionPrice,
    influencerDiscount,
    churnRate,
    avgRetentionMonths,
    refundRate,
    infraCostPerUser,
    paymentGatewayFee,
    supportCostPerUser,
    partnerCount,
    avgReferralsPerPartner
  } = inputs;

  // Effective price after discount
  const effectivePrice = avgSubscriptionPrice * (1 - influencerDiscount / 100);
  
  // Total subscribers acquired
  const totalSubscribers = Math.max(1, partnerCount * avgReferralsPerPartner);
  
  // LTV Calculation
  const monthlyRevenue = effectivePrice * (1 - paymentGatewayFee / 100);
  const monthlyOpCost = infraCostPerUser + supportCostPerUser;
  
  const totalRevenueLife = monthlyRevenue * avgRetentionMonths;
  const totalOpCostLife = monthlyOpCost * avgRetentionMonths;
  
  const firstMonthCommVal = effectivePrice * (firstMonthCommission / 100);
  const recurringCommVal = effectivePrice * (recurringCommission / 100) * (avgRetentionMonths - 1);
  const totalCommLife = firstMonthCommVal + recurringCommVal;
  
  // Total fixed fees paid upfront to influencers
  const totalUpfrontFees = partnerCount * upfrontFeePerPartner;
  const upfrontFeePerUser = totalUpfrontFees / totalSubscribers;

  const ltv = (totalRevenueLife - totalOpCostLife - totalCommLife - upfrontFeePerUser) * (1 - refundRate / 100);
  
  // CAC (via Partners)
  // CAC = (First Month Commission + Upfront Fee Allocated per User)
  const cac = firstMonthCommVal + upfrontFeePerUser;
  
  // Gross Margin
  const grossMargin = ltv;
  const grossMarginPercentage = (ltv / Math.max(1, totalRevenueLife)) * 100;
  
  // Payback Period (Months)
  const monthlyNet = (monthlyRevenue - monthlyOpCost - (effectivePrice * recurringCommission / 100));
  const paybackPeriod = cac / Math.max(0.1, (monthlyRevenue - monthlyOpCost)); 

  // Profit over time (before fixed costs)
  const monthlyProfitPerUser = monthlyNet;
  const expectedProfit3Months = (monthlyProfitPerUser * 3 * totalSubscribers) - (totalSubscribers * firstMonthCommVal) - totalUpfrontFees;
  const expectedProfit6Months = (monthlyProfitPerUser * 6 * totalSubscribers) - (totalSubscribers * firstMonthCommVal) - totalUpfrontFees;
  const expectedProfit12Months = (monthlyProfitPerUser * 12 * totalSubscribers) - (totalSubscribers * firstMonthCommVal) - totalUpfrontFees;

  // Net profit after fixed costs AND depreciation
  const totalMonthlyCosts = monthlyFixedCosts + monthlyDepreciation;
  const netProfit3Months = expectedProfit3Months - (totalMonthlyCosts * 3);
  const netProfit6Months = expectedProfit6Months - (totalMonthlyCosts * 6);
  const netProfit12Months = expectedProfit12Months - (totalMonthlyCosts * 12);

  // Break Even
  const fixedCosts = 50000;
  const breakEvenSubscribers = fixedCosts / Math.max(0.1, monthlyNet);

  return {
    cac,
    ltv,
    grossMargin,
    grossMarginPercentage,
    paybackPeriod,
    breakEvenSubscribers,
    expectedProfit3Months,
    expectedProfit6Months,
    expectedProfit12Months,
    totalSubscribers,
    totalRevenue: totalRevenueLife * totalSubscribers,
    totalMonthlyFixedCosts: monthlyFixedCosts,
    totalMonthlyDepreciation: monthlyDepreciation,
    totalCapitalInvestment: totalCapitalInvestment,
    netProfit3Months,
    netProfit6Months,
    netProfit12Months
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val);
};

export const formatPercent = (val: number) => {
  return val.toFixed(1) + '%';
};
