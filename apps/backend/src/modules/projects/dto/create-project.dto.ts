import {
  IsString,
  IsOptional,
  IsDecimal,
  IsUUID,
  IsDateString,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateProjectDto {
  @IsUUID()
  entityId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDecimal()
  @Type(() => Number)
  budget: number;

  @IsString()
  @IsOptional()
  currency?: string = "USD";

  @IsUUID()
  createdById: string;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
