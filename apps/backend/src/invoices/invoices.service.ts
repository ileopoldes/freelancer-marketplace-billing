import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const invoices = await this.prisma.invoice.findMany({
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
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

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        invoiceLines: true,
      },
    });

    if (!invoice) {
      return null;
    }

    return {
      id: invoice.id,
      customerId: invoice.customerId,
      invoiceNumber: invoice.number,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discountAmount,
      creditAmount: invoice.creditAmount,
      total: invoice.total,
      status: invoice.status,
      issueDate: invoice.createdAt.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      customer: {
        id: invoice.customer.id,
        name: invoice.customer.name,
        email: invoice.customer.email,
        creditBalance: invoice.customer.creditBalance,
        createdAt: invoice.customer.createdAt.toISOString(),
        updatedAt: invoice.customer.updatedAt.toISOString(),
      },
      lines: invoice.invoiceLines,
    };
  }
}
