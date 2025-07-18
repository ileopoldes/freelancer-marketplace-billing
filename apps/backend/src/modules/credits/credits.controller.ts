import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseFilters,
} from "@nestjs/common";
import { CreditsService } from "./credits.service";
import { PurchaseCreditsDto } from "./dto/purchase-credits.dto";
import { HttpExceptionFilter } from "../../common/filters/http-exception.filter";

@Controller("credits")
@UseFilters(HttpExceptionFilter)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post("purchase")
  @HttpCode(HttpStatus.CREATED)
  async purchaseCredits(@Body(ValidationPipe) purchaseCreditsDto: PurchaseCreditsDto) {
    return this.creditsService.purchaseCredits(purchaseCreditsDto);
  }

  @Get("balance/:entityId")
  async getBalance(@Param("entityId") entityId: string) {
    return this.creditsService.getBalance(entityId);
  }

  @Get("history/:entityId")
  async getHistory(
    @Param("entityId") entityId: string,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number,
  ) {
    return this.creditsService.getHistory(entityId, limit, offset);
  }

  @Get("packages")
  async getAvailablePackages() {
    return this.creditsService.getAvailablePackages();
  }

  @Post("deduct")
  @HttpCode(HttpStatus.OK)
  async deductCredits(
    @Body(ValidationPipe) deductCreditsDto: { entityId: string; amount: number; userId: string; reason: string },
  ) {
    return this.creditsService.deductCredits(
      deductCreditsDto.entityId,
      deductCreditsDto.amount,
      deductCreditsDto.userId,
      deductCreditsDto.reason,
    );
  }
}
