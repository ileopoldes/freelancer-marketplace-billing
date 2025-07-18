import { IsString, IsEmail, IsOptional, IsEnum } from "class-validator";
import { BillingModel } from "../../../common/enums/user-roles.enum";

export class CreateOrganizationDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  domain?: string;

  @IsEmail()
  billingEmail: string;

  @IsEnum(BillingModel)
  billingModel: BillingModel;

  @IsString()
  @IsOptional()
  description?: string;
}
