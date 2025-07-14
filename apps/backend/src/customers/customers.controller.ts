import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll() {
    try {
      const customers = await this.customersService.findAll();
      return { customers };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch customers',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const customer = await this.customersService.findOne(id);
      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }
      return customer;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch customer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/invoices')
  async getCustomerInvoices(@Param('id') id: string) {
    try {
      const invoices = await this.customersService.getCustomerInvoices(id);
      return { invoices };
    } catch (error) {
      throw new HttpException(
        'Failed to fetch customer invoices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
