import {
  Controller,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { InvoicesService } from "./invoices.service";

@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  async findAll() {
    try {
      const invoices = await this.invoicesService.findAll();
      return { invoices };
    } catch (error) {
      throw new HttpException(
        "Failed to fetch invoices",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    try {
      const invoice = await this.invoicesService.findOne(id);
      if (!invoice) {
        throw new HttpException("Invoice not found", HttpStatus.NOT_FOUND);
      }
      return invoice;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        "Failed to fetch invoice",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
