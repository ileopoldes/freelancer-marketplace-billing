import { PrismaClient } from '@prisma/client';
import {
  Money,
  createMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  moneyToDecimalString,
  moneyFromDecimalString,
  InvoiceStatus,
  LineType,
  Currency,
  InvoicePrefix,
} from '@marketplace/shared';
// Legacy pricing imports removed - using simplified billing logic
import { CreditPackageManager } from './CreditPackageManager';
import { ProrationEngine } from '../pricing/ProrationEngine';

export interface ContractWithCustomer {
  id: string;
  customerId: string;
  baseFee: string;
  minCommitCalls: number;
  callOverageFee: string;
  discountRate: string;
  billingCycle?: number;
  nextBillingDate?: Date;
  customer: {
    id: string;
    name: string;
    email: string;
    creditBalance: string;
  };
}

export interface InvoiceCalculation {
  subtotal: Money;
  discountAmount: Money;
  creditAmount: Money;
  total: Money;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  lineType: string;
  description: string;
  quantity: number;
  unitAmount: Money;
  amount: Money;
}

/**
 * Service for generating invoices with complex pricing logic
 */
export class InvoiceGenerator {
  private creditPackageManager: CreditPackageManager;
  private prorationEngine: ProrationEngine;

  constructor(private prisma: PrismaClient) {
    // Initialize services
    this.creditPackageManager = new CreditPackageManager(prisma);
    this.prorationEngine = new ProrationEngine();
  }

  /**
   * Generate invoice for a contract
   */
  async generateInvoice(
    contract: ContractWithCustomer,
    usage: number,
    periodStart: Date,
    periodEnd: Date,
    billingCycle: number
  ): Promise<any> {
    // Check for existing invoice (idempotency)
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        contractId: contract.id,
        periodStart,
        periodEnd,
      },
    });

    if (existingInvoice) {
      return existingInvoice;
    }

    // Calculate invoice amounts
    const calculation = await this.calculateInvoiceAmounts(
      contract,
      usage,
      billingCycle
    );

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Create invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        customerId: contract.customerId,
        contractId: contract.id,
        number: invoiceNumber,
        status: InvoiceStatus.OPEN,
        subtotal: moneyToDecimalString(calculation.subtotal),
        discountAmount: moneyToDecimalString(calculation.discountAmount),
        creditAmount: moneyToDecimalString(calculation.creditAmount),
        total: moneyToDecimalString(calculation.total),
        currency: Currency.USD,
        periodStart,
        periodEnd,
        billingCycle,
        dueDate: this.calculateDueDate(new Date()),
      },
    });

    // Create invoice line items
    await this.createInvoiceLines(invoice.id, calculation.lineItems);

    return invoice;
  }

  /**
   * Calculate all invoice amounts and line items
   */
  async calculateInvoiceAmounts(
    contract: ContractWithCustomer,
    usage: number,
    billingCycle: number
  ): Promise<InvoiceCalculation> {
    const lineItems: InvoiceLineItem[] = [];
    let subtotal = createMoney('0');

    // 1. Base fee (flat recurring charge)
    const baseFee = moneyFromDecimalString(contract.baseFee);
    if (baseFee.amount.greaterThan(0)) {
      lineItems.push({
        lineType: LineType.BASE_FEE,
        description: 'Monthly base fee',
        quantity: 1,
        unitAmount: baseFee,
        amount: baseFee,
      });
      subtotal = addMoney(subtotal, baseFee);
    }

    // 2. Usage charges (simplified pricing)
    const callOverageFee = moneyFromDecimalString(contract.callOverageFee);
    if (usage > contract.minCommitCalls) {
      const overageQuantity = usage - contract.minCommitCalls;
      const overageAmount = multiplyMoney(callOverageFee, overageQuantity);
      
      lineItems.push({
        lineType: LineType.USAGE_OVERAGE,
        description: `Usage overage: ${overageQuantity} calls at ${callOverageFee.amount.toString()}`,
        quantity: overageQuantity,
        unitAmount: callOverageFee,
        amount: overageAmount,
      });
      subtotal = addMoney(subtotal, overageAmount);
    }

    // 3. Apply simple discount based on contract discount rate
    let discountAmount = createMoney('0');
    const discountRate = parseFloat(contract.discountRate);
    
    if (discountRate > 0 && billingCycle <= 3) {
      discountAmount = multiplyMoney(subtotal, discountRate);
      lineItems.push({
        lineType: LineType.DISCOUNT,
        description: `${(discountRate * 100).toFixed(1)}% discount (cycle ${billingCycle})`,
        quantity: 1,
        unitAmount: createMoney('0'),
        amount: createMoney(discountAmount.amount.negated().toString()),
      });
    }

    // 4. Apply available credits
    const invoiceTotal = subtractMoney(subtotal, discountAmount);
    const creditResult = await this.applyCredits(
      contract.customerId,
      invoiceTotal,
      'pending' // Will be updated with actual invoice ID
    );
    const totalCreditsApplied = creditResult.totalCreditsApplied;

    if (totalCreditsApplied.amount.greaterThan(0)) {
      lineItems.push({
        lineType: LineType.CREDIT,
        description: 'Applied credits',
        quantity: 1,
        unitAmount: createMoney('0'),
        amount: createMoney(totalCreditsApplied.amount.negated().toString()),
      });
    }

    // Calculate final total
    const total = subtractMoney(
      subtractMoney(subtotal, discountAmount),
      totalCreditsApplied
    );

    return {
      subtotal,
      discountAmount,
      creditAmount: totalCreditsApplied,
      total,
      lineItems,
    };
  }

  /**
   * Apply available credits to invoice
   */
  async applyCredits(
    customerId: string,
    invoiceTotal: Money,
    invoiceId: string
  ): Promise<{ totalCreditsApplied: Money; finalTotal: Money }> {
    // Get available credits
    const availableCredits = await this.prisma.credit.findMany({
      where: {
        customerId,
        appliedAt: null, // Only unapplied credits
      },
      orderBy: { createdAt: 'asc' }, // Apply oldest credits first
    });

    let totalCreditsApplied = createMoney('0');
    let remainingInvoiceAmount = invoiceTotal;
    const creditsToApply: string[] = [];

    // Apply credits until invoice is paid or no more credits
    for (const credit of availableCredits) {
      if (remainingInvoiceAmount.amount.lessThanOrEqualTo(0)) {
        break;
      }

      const creditAmount = moneyFromDecimalString(credit.amount.toString());
      const appliedAmount = {
        amount: creditAmount.amount.lessThanOrEqualTo(remainingInvoiceAmount.amount)
          ? creditAmount.amount
          : remainingInvoiceAmount.amount,
        currency: creditAmount.currency,
      };

      totalCreditsApplied = addMoney(totalCreditsApplied, appliedAmount);
      remainingInvoiceAmount = subtractMoney(remainingInvoiceAmount, appliedAmount);
      creditsToApply.push(credit.id);

      // If we only partially used this credit, we'd need to create a new credit
      // for the remaining amount, but for simplicity, we'll apply whole credits
    }

    // Mark credits as applied
    if (creditsToApply.length > 0 && invoiceId !== 'pending') {
      await this.prisma.credit.updateMany({
        where: {
          id: { in: creditsToApply },
        },
        data: {
          appliedAt: new Date(),
        },
      });
    }

    return {
      totalCreditsApplied,
      finalTotal: remainingInvoiceAmount,
    };
  }

  /**
   * Create invoice line items
   */
  private async createInvoiceLines(
    invoiceId: string,
    lineItems: InvoiceLineItem[]
  ): Promise<void> {
    const lineData = lineItems.map((item) => ({
      invoiceId,
      lineType: item.lineType as any,
      description: item.description,
      quantity: item.quantity,
      unitAmount: moneyToDecimalString(item.unitAmount),
      amount: moneyToDecimalString(item.amount),
      currency: Currency.USD,
    }));

    await this.prisma.invoiceLine.createMany({
      data: lineData,
    });
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const prefix = process.env.INVOICE_NUMBER_PREFIX || InvoicePrefix.STANDARD;
    const year = new Date().getFullYear();
    
    // Get the count of invoices this year
    const invoiceCount = await this.prisma.invoice.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    });

    const sequenceNumber = (invoiceCount + 1).toString().padStart(6, '0');
    return `${prefix}-${year}-${sequenceNumber}`;
  }

  /**
   * Calculate due date (30 days from invoice date)
   */
  private calculateDueDate(invoiceDate: Date): Date {
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate;
  }
}

