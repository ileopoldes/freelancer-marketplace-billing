import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
    });
  }

  async getCustomerInvoices(id: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { customerId: id },
      include: {
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      customerId: invoice.customerId,
      invoiceNumber: invoice.number,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      creditAmount: invoice.creditAmount,
      total: invoice.total,
      status: invoice.status,
      issueDate: invoice.createdAt.toISOString(),
      dueDate: invoice.dueDate
        ? invoice.dueDate.toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      customer: {
        id: invoice.customer.id,
        name: invoice.customer.name,
        email: invoice.customer.email,
        creditBalance: invoice.customer.creditBalance,
        createdAt: invoice.customer.createdAt.toISOString(),
        updatedAt: invoice.customer.updatedAt.toISOString(),
      },
    }));
  }
}
