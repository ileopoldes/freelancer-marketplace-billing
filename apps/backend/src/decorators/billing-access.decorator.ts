import { SetMetadata } from "@nestjs/common";

export interface BillingAccessOptions {
  requiresCredits?: boolean;
  minCreditsRequired?: number;
  adminOnly?: boolean;
  featureName?: string;
}

export const BILLING_ACCESS_KEY = "billingAccess";

export const BillingAccess = (options: BillingAccessOptions) =>
  SetMetadata(BILLING_ACCESS_KEY, options);
