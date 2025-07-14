import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

export async function invoiceRoutes(server: FastifyInstance, options: { prisma: PrismaClient }) {
  const { prisma } = options;

  // Get all invoices
  server.get('/api/invoices', async (request, reply) => {
    try {
      const invoices = await prisma.invoice.findMany({
        include: {
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      
      const formattedInvoices = invoices.map(invoice => ({
        id: invoice.id,
        customerId: invoice.customerId,
        invoiceNumber: invoice.number,
        subtotal: invoice.subtotal,
        discountAmount: invoice.discountAmount,
        creditAmount: invoice.creditAmount,
        total: invoice.total,
        status: invoice.status,
        issueDate: invoice.createdAt.toISOString(),
        dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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
      
      return { invoices: formattedInvoices };
    } catch (error) {
      server.log.error('Failed to fetch invoices:', error);
      reply.status(500);
      return { error: 'Failed to fetch invoices' };
    }
  });

  // Get invoice by ID
  server.get('/api/invoices/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          customer: true,
          invoiceLines: true,
        },
      });
      
      if (!invoice) {
        reply.status(404);
        return { error: 'Invoice not found' };
      }
      
      const formattedInvoice = {
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
      
      return formattedInvoice;
    } catch (error) {
      server.log.error('Failed to fetch invoice:', error);
      reply.status(500);
      return { error: 'Failed to fetch invoice' };
    }
  });
}

