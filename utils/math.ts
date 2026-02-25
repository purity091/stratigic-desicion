
import { SimulationInputs, SimulationMetrics } from '../types';

export const calculateMetrics = (inputs: SimulationInputs): SimulationMetrics => {
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

  // Profit over time
  const monthlyProfitPerUser = monthlyNet;
  const expectedProfit3Months = (monthlyProfitPerUser * 3 * totalSubscribers) - (totalSubscribers * firstMonthCommVal) - totalUpfrontFees;
  const expectedProfit6Months = (monthlyProfitPerUser * 6 * totalSubscribers) - (totalSubscribers * firstMonthCommVal) - totalUpfrontFees;
  const expectedProfit12Months = (monthlyProfitPerUser * 12 * totalSubscribers) - (totalSubscribers * firstMonthCommVal) - totalUpfrontFees;

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
    totalRevenue: totalRevenueLife * totalSubscribers
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val);
};

export const formatPercent = (val: number) => {
  return val.toFixed(1) + '%';
};
