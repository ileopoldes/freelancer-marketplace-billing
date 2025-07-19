import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  Min,
} from "class-validator";

export enum CreditType {
  MANUAL = "MANUAL",
  REFUND = "REFUND",
  ADJUSTMENT = "ADJUSTMENT",
  PROMOTIONAL = "PROMOTIONAL",
}

export class AddCreditsDto {
  @IsNotEmpty()
  @IsString()
  entityId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(CreditType)
  type?: CreditType = CreditType.MANUAL;
}
