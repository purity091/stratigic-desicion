
import { ScenarioType, SimulationInputs } from './types';

export const DEFAULT_INPUTS: Record<ScenarioType, SimulationInputs> = {
  [ScenarioType.REALISTIC]: {
    firstMonthCommission: 30,
    recurringCommission: 15,
    upfrontFeePerPartner: 500,
    avgSubscriptionPrice: 150,
    influencerDiscount: 10,
    conversionRate: 2.5,
    churnRate: 10,
    avgRetentionMonths: 6,
    refundRate: 3,
    infraCostPerUser: 15,
    paymentGatewayFee: 2.5,
    supportCostPerUser: 10,
    partnerCount: 50,
    avgReferralsPerPartner: 10
  },
  [ScenarioType.OPTIMISTIC]: {
    firstMonthCommission: 30,
    recurringCommission: 10,
    upfrontFeePerPartner: 0,
    avgSubscriptionPrice: 150,
    influencerDiscount: 5,
    conversionRate: 5,
    churnRate: 5,
    avgRetentionMonths: 10,
    refundRate: 1,
    infraCostPerUser: 10,
    paymentGatewayFee: 2.5,
    supportCostPerUser: 5,
    partnerCount: 100,
    avgReferralsPerPartner: 20
  },
  [ScenarioType.PESSIMISTIC]: {
    firstMonthCommission: 40,
    recurringCommission: 25,
    upfrontFeePerPartner: 2000,
    avgSubscriptionPrice: 150,
    influencerDiscount: 20,
    conversionRate: 1,
    churnRate: 20,
    avgRetentionMonths: 3,
    refundRate: 10,
    infraCostPerUser: 25,
    paymentGatewayFee: 2.5,
    supportCostPerUser: 20,
    partnerCount: 20,
    avgReferralsPerPartner: 5
  }
};
