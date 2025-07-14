import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

export async function customerRoutes(server: FastifyInstance, options: { prisma: PrismaClient }) {
  const { prisma } = options;

  // Get all customers
  server.get('/api/customers', async (request, reply) => {
    try {
      const customers = await prisma.customer.findMany({
        orderBy: { name: 'asc' },
      });
      
      return { customers };
    } catch (error) {
      server.log.error('Failed to fetch customers:', error);
      reply.status(500);
      return { error: 'Failed to fetch customers' };
    }
  });

  // Get customer by ID
  server.get('/api/customers/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const customer = await prisma.customer.findUnique({
        where: { id },
      });
      
      if (!customer) {
        reply.status(404);
        return { error: 'Customer not found' };
      }
      
      return customer;
    } catch (error) {
      server.log.error('Failed to fetch customer:', error);
      reply.status(500);
      return { error: 'Failed to fetch customer' };
    }
  });

  // Get customer invoices
  server.get('/api/customers/:id/invoices', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const invoices = await prisma.invoice.findMany({
        where: { customerId: id },
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
      server.log.error('Failed to fetch customer invoices:', error);
      reply.status(500);
      return { error: 'Failed to fetch customer invoices' };
    }
  });
}

