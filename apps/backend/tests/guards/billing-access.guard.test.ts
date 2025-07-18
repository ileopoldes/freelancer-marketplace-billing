import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext } from "@nestjs/common";
import { BillingAccessGuard } from "../../src/guards/billing-access.guard";
import { BillingMiddleware } from "../../src/middleware/billing.middleware";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../src/prisma/prisma.service";

describe("BillingAccessGuard", () => {
  let guard: BillingAccessGuard;
  let billingMiddleware: jest.Mocked<BillingMiddleware>;
  let reflector: Reflector;

  beforeEach(async () => {
    const mockPrismaService = {
      entity: { findUnique: jest.fn() },
      entityCreditBalance: { findFirst: jest.fn() },
      entityUser: { findFirst: jest.fn() },
      user: { findUnique: jest.fn() },
    };

    const mockBillingMiddleware = {
      validateCreditPurchase: jest.fn(),
      validateCreditDeduction: jest.fn(),
      validateFeatureAccess: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingAccessGuard,
        {
          provide: BillingMiddleware,
          useValue: mockBillingMiddleware,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<BillingAccessGuard>(BillingAccessGuard);
    billingMiddleware = module.get(
      BillingMiddleware,
    ) as jest.Mocked<BillingMiddleware>;
    reflector = module.get<Reflector>(Reflector);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    it("should allow access when no billing restriction is set", async () => {
      jest.spyOn(reflector, "get").mockReturnValue(undefined);
      const ctxMock: Partial<ExecutionContext> = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue({}),
          getResponse: jest.fn(),
          getNext: jest.fn(),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      };
      const result = await guard.canActivate(ctxMock as ExecutionContext);
      expect(result).toBe(true);
    });

    it("should call validateCreditPurchase for adminOnly", async () => {
      jest.spyOn(reflector, "get").mockReturnValue({ adminOnly: true });
      const ctxMock: Partial<ExecutionContext> = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue({
            params: {
              entityId: "entity-123",
              userId: "user-456",
            },
          }),
          getResponse: jest.fn(),
          getNext: jest.fn(),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      };
      billingMiddleware.validateCreditPurchase.mockResolvedValue();

      const result = await guard.canActivate(ctxMock as ExecutionContext);
      expect(result).toBe(true);
      expect(billingMiddleware.validateCreditPurchase).toHaveBeenCalledWith(
        "entity-123",
        "user-456",
      );
    });

    it("should call validateCreditDeduction for requiresCredits", async () => {
      jest
        .spyOn(reflector, "get")
        .mockReturnValue({ requiresCredits: true, minCreditsRequired: 10 });
      const ctxMock: Partial<ExecutionContext> = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue({
            params: {
              entityId: "entity-123",
            },
          }),
          getResponse: jest.fn(),
          getNext: jest.fn(),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      };
      billingMiddleware.validateCreditDeduction.mockResolvedValue();

      const result = await guard.canActivate(ctxMock as ExecutionContext);
      expect(result).toBe(true);
      expect(billingMiddleware.validateCreditDeduction).toHaveBeenCalledWith(
        "entity-123",
        10,
      );
    });

    it("should call validateFeatureAccess for featureName", async () => {
      jest
        .spyOn(reflector, "get")
        .mockReturnValue({ featureName: "project_creation" });
      const ctxMock: Partial<ExecutionContext> = {
        switchToHttp: () => ({
          getRequest: jest.fn().mockReturnValue({
            params: {
              entityId: "entity-123",
            },
          }),
          getResponse: jest.fn(),
          getNext: jest.fn(),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
        getArgs: jest.fn(),
        getArgByIndex: jest.fn(),
        switchToRpc: jest.fn(),
        switchToWs: jest.fn(),
        getType: jest.fn(),
      };
      billingMiddleware.validateFeatureAccess.mockResolvedValue();

      const result = await guard.canActivate(ctxMock as ExecutionContext);
      expect(result).toBe(true);
      expect(billingMiddleware.validateFeatureAccess).toHaveBeenCalledWith(
        "entity-123",
        "project_creation",
      );
    });
  });
});
