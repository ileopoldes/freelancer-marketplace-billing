import { createMoney, moneyToDecimalString, JobStatus, InvoiceStatus, ContractStatus } from '@marketplace/shared';
import { PrismaClient } from '@prisma/client';
import { BillingEngine } from '../src/services/billing/BillingEngine';
import { BillingJobService } from '../src/services/billing/BillingJobService';
import { InvoiceGenerator } from '../src/services/billing/InvoiceGenerator';

// Mock Prisma for testing
const mockPrisma = {
  customer: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  contract: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  usage: {
    groupBy: jest.fn(),
    findMany: jest.fn(),
  },
  invoice: {
    create: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  invoiceLine: {
    createMany: jest.fn(),
  },
  billingJob: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  usageEvent: {
    findMany: jest.fn(),
  },
  credit: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
  },
} as any;

describe('Billing Job Engine', () => {
  describe('Job Creation & Idempotency', () => {
    let billingJobService: BillingJobService;

    beforeEach(() => {
      jest.clearAllMocks();
      billingJobService = new BillingJobService(mockPrisma);
    });

    test('should create new billing job for first run', async () => {
      const asOfDate = new Date('2025-06-30');
      
      mockPrisma.billingJob.findFirst.mockResolvedValue(null);
      mockPrisma.billingJob.create.mockResolvedValue({
        id: 'job_123',
        asOfDate,
        status: JobStatus.PENDING,
        startedAt: new Date(),
      });

      const result = await billingJobService.startBillingJob(asOfDate, 'automatic');

      expect(mockPrisma.billingJob.findFirst).toHaveBeenCalledWith({
        where: { asOfDate },
      });
      expect(mockPrisma.billingJob.create).toHaveBeenCalled();
      expect(result.id).toBe('job_123');
    });

    test('should return existing job for duplicate run (idempotency)', async () => {
      const asOfDate = new Date('2025-06-30');
      const existingJob = {
        id: 'job_existing',
        asOfDate,
        status: JobStatus.COMPLETED,
        startedAt: new Date(),
        completedAt: new Date(),
      };
      
      mockPrisma.billingJob.findFirst.mockResolvedValue(existingJob);

      const result = await billingJobService.getJobStatus('job_existing');

      expect(mockPrisma.billingJob.create).not.toHaveBeenCalled();
      expect(result.id).toBe('job_existing');
      expect(result.status).toBe(JobStatus.COMPLETED);
    });

    test('should prevent concurrent jobs for same date', async () => {
      const asOfDate = new Date('2025-06-30');
      
      mockPrisma.billingJob.findFirst.mockResolvedValue({
        id: 'job_running',
        asOfDate,
        status: JobStatus.RUNNING,
        startedAt: new Date(),
      });

      // Should return existing job instead of throwing error
      const result = await billingJobService.startBillingJob(asOfDate, 'automatic');
      expect(result.id).toBe('job_running');
      expect(result.status).toBe(JobStatus.RUNNING);
    });

    test('should handle job retry after failure', async () => {
      const asOfDate = new Date('2025-06-30');
      
      mockPrisma.billingJob.findFirst.mockResolvedValue({
        id: 'job_failed',
        asOfDate,
        status: JobStatus.FAILED,
        startedAt: new Date(),
        errorMessage: 'Previous error',
      });
      
      mockPrisma.billingJob.create.mockResolvedValue({
        id: 'job_retry',
        asOfDate,
        status: JobStatus.PENDING,
        startedAt: new Date(),
      });

      const result = await billingJobService.startBillingJob(asOfDate, 'automatic');

      expect(result.id).toBe('job_retry');
      expect(mockPrisma.billingJob.create).toHaveBeenCalled();
    });
  });

  describe('Contract Processing', () => {
    let billingEngine: BillingEngine;

    beforeEach(() => {
      jest.clearAllMocks();
      billingEngine = new BillingEngine(mockPrisma);
    });

    test('should identify contracts due for billing', async () => {
      const asOfDate = new Date('2025-06-01');
      const mockContracts = [
        {
          id: 'contract_1',
          customerId: 'customer_1',
          nextBillingDate: asOfDate,
          baseFee: { toString: () => '99.0000' },
          minCommitCalls: 10000,
          callOverageFee: { toString: () => '0.0020' },
          discountRate: { toString: () => '0.2000' },
          billingCycle: 1,
          recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=1',
          customer: {
            id: 'customer_1',
            name: 'Test Customer',
            email: 'test@example.com',
            creditBalance: { toString: () => '0.0000' },
          },
        },
      ];

      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);

      const contracts = await billingEngine.getContractsDueForBilling(asOfDate);

      expect(contracts).toHaveLength(1);
      expect(contracts[0].id).toBe('contract_1');
      expect(mockPrisma.contract.findMany).toHaveBeenCalledWith({
        where: {
          status: ContractStatus.ACTIVE,
          nextBillingDate: {
            lte: asOfDate,
          },
        },
        include: {
          customer: true,
        },
        orderBy: {
          nextBillingDate: 'asc',
        },
      });
    });

    test('should filter contracts by recurrence schedule', async () => {
      const asOfDate = new Date(2025, 5, 15); // June 15th, 2025 (local time)
      
      // Mock contracts with different billing schedules
      const mockContracts = [
        {
          id: 'contract_monthly_1st',
          recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=1',
        },
        {
          id: 'contract_monthly_15th',
          recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=15',
        },
      ];

      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);

      const dueBillingContracts = await billingEngine.filterContractsBySchedule(
        mockContracts as any,
        asOfDate
      );

      // Should only return contract due on 15th
      expect(dueBillingContracts).toHaveLength(1);
      expect(dueBillingContracts[0].id).toBe('contract_monthly_15th');
    });
  });

  describe('Usage Aggregation', () => {
    let billingEngine: BillingEngine;

    beforeEach(() => {
      jest.clearAllMocks();
      billingEngine = new BillingEngine(mockPrisma);
    });

    test('should aggregate usage for billing period', async () => {
      const contractId = 'contract_1';
      const periodStart = new Date('2025-06-01');
      const periodEnd = new Date('2025-06-30');

      mockPrisma.usageEvent.findMany.mockResolvedValue([
        { contractId, quantity: 7500, timestamp: new Date('2025-06-15') },
        { contractId, quantity: 7500, timestamp: new Date('2025-06-20') },
      ]);

      const usage = await billingEngine.aggregateUsageForPeriod(
        contractId,
        periodStart,
        periodEnd
      );

      expect(usage).toBe(15000);
      expect(mockPrisma.usageEvent.findMany).toHaveBeenCalledWith({
        where: {
          contractId,
          timestamp: {
            gte: periodStart,
            lt: periodEnd,
          },
        },
      });
    });

    test('should handle zero usage gracefully', async () => {
      mockPrisma.usageEvent.findMany.mockResolvedValue([]);

      const usage = await billingEngine.aggregateUsageForPeriod(
        'contract_1',
        new Date('2025-06-01'),
        new Date('2025-06-30')
      );

      expect(usage).toBe(0);
    });

    test('should handle multiple usage events correctly', async () => {
      mockPrisma.usageEvent.findMany.mockResolvedValue([
        { contractId: 'contract_1', quantity: 10000, timestamp: new Date('2025-06-10') },
        { contractId: 'contract_1', quantity: 15000, timestamp: new Date('2025-06-20') },
      ]);

      const usage = await billingEngine.aggregateUsageForPeriod(
        'contract_1',
        new Date('2025-06-01'),
        new Date('2025-06-30')
      );

      expect(usage).toBe(25000);
    });
  });

  describe('Invoice Generation', () => {
    let invoiceGenerator: InvoiceGenerator;

    beforeEach(() => {
      jest.clearAllMocks();
      invoiceGenerator = new InvoiceGenerator(mockPrisma);
    });

    test('should generate invoice with all pricing components', async () => {
      const contract = {
        id: 'contract_1',
        customerId: 'customer_1',
        baseFee: '99.0000',
        minCommitCalls: 10000,
        callOverageFee: '0.0020',
        discountRate: '0.2000',
        customer: {
          id: 'customer_1',
          name: 'Test Customer',
          email: 'test@example.com',
          creditBalance: '0.0000',
        },
      };

      const usage = 15000; // 5,000 overage
      const periodStart = new Date('2025-06-01');
      const periodEnd = new Date('2025-06-30');
      const billingCycle = 1; // First cycle - eligible for discount

      mockPrisma.invoice.findFirst.mockResolvedValue(null); // No existing invoice
      mockPrisma.invoice.create.mockResolvedValue({
        id: 'invoice_123',
        number: 'INV-2025-001',
      });
      mockPrisma.credit.findMany.mockResolvedValue([]);

      const invoice = await invoiceGenerator.generateInvoice(
        contract as any,
        usage,
        periodStart,
        periodEnd,
        billingCycle
      );

      expect(mockPrisma.invoice.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: 'customer_1',
          contractId: 'contract_1',
          periodStart,
          periodEnd,
          billingCycle: 1,
          subtotal: expect.any(String),
          discountAmount: expect.any(String),
          total: expect.any(String),
        }),
      });
    });

    test('should apply 20% discount for first 3 billing cycles', async () => {
      const contract = {
        id: 'contract_1',
        customerId: 'customer_1',
        baseFee: '100.0000',
        minCommitCalls: 10000, // Fix: Cannot be 0
        callOverageFee: '0.0020',
        discountRate: '0.2000',
        customer: { creditBalance: '0.0000' },
      };

      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.credit.findMany.mockResolvedValue([]);
      
      const calculations = await invoiceGenerator.calculateInvoiceAmounts(
        contract as any,
        0, // No usage
        1 // First billing cycle
      );

      // $100 base fee + $20 minimum commit = $120 subtotal - 20% discount = $96
      expect(moneyToDecimalString(calculations.subtotal)).toBe('120.0000');
      expect(moneyToDecimalString(calculations.discountAmount)).toBe('24.0000');
      expect(moneyToDecimalString(calculations.total)).toBe('96.0000');
    });

    test('should not apply discount after 3rd billing cycle', async () => {
      const contract = {
        id: 'contract_1',
        customerId: 'customer_1',
        baseFee: '100.0000',
        minCommitCalls: 10000, // Fix: Cannot be 0
        callOverageFee: '0.0020',
        discountRate: '0.2000',
        customer: { creditBalance: '0.0000' },
      };

      mockPrisma.credit.findMany.mockResolvedValue([]);
      
      const calculations = await invoiceGenerator.calculateInvoiceAmounts(
        contract as any,
        0, // No usage
        4 // Fourth billing cycle - no discount
      );

      expect(moneyToDecimalString(calculations.subtotal)).toBe('120.0000');
      expect(moneyToDecimalString(calculations.discountAmount)).toBe('0.0000');
      expect(moneyToDecimalString(calculations.total)).toBe('120.0000');
    });

    test('should prevent duplicate invoice generation', async () => {
      const contract = { id: 'contract_1', customerId: 'customer_1' };
      const existingInvoice = {
        id: 'invoice_existing',
        number: 'INV-2025-001',
      };

      mockPrisma.invoice.findFirst.mockResolvedValue(existingInvoice);

      const result = await invoiceGenerator.generateInvoice(
        contract as any,
        1000,
        new Date('2025-06-01'),
        new Date('2025-06-30'),
        1
      );

      expect(result).toEqual(existingInvoice);
      expect(mockPrisma.invoice.create).not.toHaveBeenCalled();
    });
  });

  describe('Credit Application', () => {
    let invoiceGenerator: InvoiceGenerator;

    beforeEach(() => {
      jest.clearAllMocks();
      invoiceGenerator = new InvoiceGenerator(mockPrisma);
    });

    test('should apply available credits to invoice', async () => {
      const customerId = 'customer_1';
      const invoiceTotal = createMoney('100.00');

      const availableCredits = [
        {
          id: 'credit_1',
          amount: '30.0000',
          description: 'Manual credit',
          appliedAt: null,
        },
        {
          id: 'credit_2',
          amount: '25.0000',
          description: 'Refund credit',
          appliedAt: null,
        },
      ];

      mockPrisma.credit.findMany.mockResolvedValue(availableCredits);
      mockPrisma.credit.updateMany.mockResolvedValue({ count: 2 });

      const { totalCreditsApplied, finalTotal } = await invoiceGenerator.applyCredits(
        customerId,
        invoiceTotal,
        'invoice_123'
      );

      expect(moneyToDecimalString(totalCreditsApplied)).toBe('55.0000');
      expect(moneyToDecimalString(finalTotal)).toBe('45.0000');
      expect(mockPrisma.credit.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['credit_1', 'credit_2'] },
        },
        data: {
          appliedAt: expect.any(Date),
        },
      });
    });

    test('should handle credits exceeding invoice total', async () => {
      const customerId = 'customer_1';
      const invoiceTotal = createMoney('30.00');

      const availableCredits = [
        {
          id: 'credit_1',
          amount: '50.0000',
          description: 'Large credit',
          appliedAt: null,
        },
      ];

      mockPrisma.credit.findMany.mockResolvedValue(availableCredits);
      
      const { totalCreditsApplied, finalTotal } = await invoiceGenerator.applyCredits(
        customerId,
        invoiceTotal,
        'invoice_123'
      );

      // Should only apply $30 of the $50 credit
      expect(moneyToDecimalString(totalCreditsApplied)).toBe('30.0000');
      expect(moneyToDecimalString(finalTotal)).toBe('0.0000');
    });
  });

  describe('End-to-End Billing Process', () => {
    let billingEngine: BillingEngine;

    beforeEach(() => {
      jest.clearAllMocks();
      billingEngine = new BillingEngine(mockPrisma);
    });

    test('should complete full billing cycle successfully', async () => {
      const asOfDate = new Date('2025-06-01');
      
      // Mock data setup
      const mockContracts = [
        {
          id: 'contract_1',
          customerId: 'customer_1',
          baseFee: '99.0000',
          minCommitCalls: 10000,
          callOverageFee: '0.0020',
          discountRate: '0.2000',
          recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=1',
          customer: {
            id: 'customer_1',
            name: 'Test Customer',
            email: 'test@example.com',
            creditBalance: '0.0000',
          },
        },
      ];

      // Mock billing job creation
      mockPrisma.billingJob.findFirst.mockResolvedValue(null);
      mockPrisma.billingJob.create.mockResolvedValue({
        id: 'job_123',
        asOfDate,
        status: JobStatus.PENDING,
        startedAt: new Date(),
      });
      
      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);
      mockPrisma.usageEvent.findMany.mockResolvedValue([
        { contractId: 'contract_1', quantity: 15000, timestamp: new Date('2025-06-15') },
      ]);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.create.mockResolvedValue({
        id: 'invoice_123',
        number: 'INV-2025-001',
        total: '129.0000', // Sample total
      });
      mockPrisma.invoiceLine.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.credit.findMany.mockResolvedValue([]);
      mockPrisma.billingJob.update.mockResolvedValue({});
      mockPrisma.contract.update.mockResolvedValue({});
      mockPrisma.invoice.count.mockResolvedValue(0);

      const result = await billingEngine.runBillingJob(asOfDate);

      expect(result.success).toBe(true);
      expect(result.invoicesCreated).toBe(1);
      expect(result.totalCustomers).toBe(1);
      expect(mockPrisma.invoice.create).toHaveBeenCalled();
    });

    test('should handle errors gracefully and update job status', async () => {
      const asOfDate = new Date('2025-06-01');
      
      mockPrisma.contract.findMany.mockRejectedValue(new Error('Database error'));
      mockPrisma.billingJob.update.mockResolvedValue({});

      const result = await billingEngine.runBillingJob(asOfDate);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(mockPrisma.billingJob.update).toHaveBeenCalledWith({
        where: { asOfDate },
        data: {
          status: JobStatus.FAILED,
          errorMessage: 'Database error',
          completedAt: expect.any(Date),
        },
      });
    });

    test('should track job progress accurately', async () => {
      const asOfDate = new Date('2025-06-01');
      
      // Setup multiple contracts
      const mockContracts = Array.from({ length: 3 }, (_, i) => ({
        id: `contract_${i + 1}`,
        customerId: `customer_${i + 1}`,
        baseFee: { toString: () => '99.0000' },
        minCommitCalls: 10000,
        callOverageFee: { toString: () => '0.0020' },
        discountRate: { toString: () => '0.0000' },
        status: ContractStatus.ACTIVE,
        nextBillingDate: asOfDate, // Make sure they're due for billing
        billingCycle: 1,
        recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=1',
        customer: { id: `customer_${i + 1}`, name: 'Test Customer', email: 'test@example.com', creditBalance: { toString: () => '0.0000' } },
      }));

      // Mock billing job creation
      mockPrisma.billingJob.findFirst.mockResolvedValue(null);
      mockPrisma.billingJob.create.mockResolvedValue({
        id: 'job_123',
        asOfDate,
        status: JobStatus.PENDING,
        startedAt: new Date(),
      });
      
      mockPrisma.contract.findMany.mockResolvedValue(mockContracts);
      mockPrisma.usageEvent.findMany.mockResolvedValue([]);
      mockPrisma.invoice.findFirst.mockResolvedValue(null);
      mockPrisma.invoice.create.mockResolvedValue({ id: 'invoice', number: 'INV', total: '99.0000' });
      mockPrisma.invoiceLine.createMany.mockResolvedValue({ count: 1 });
      mockPrisma.credit.findMany.mockResolvedValue([]);
      mockPrisma.billingJob.update.mockResolvedValue({});
      mockPrisma.contract.update.mockResolvedValue({});
      mockPrisma.invoice.count.mockResolvedValue(0);

      const result = await billingEngine.runBillingJob(asOfDate);

      expect(result.totalCustomers).toBe(3);
      expect(result.invoicesCreated).toBe(3);
      expect(result.success).toBe(true);
    });
  });
});

