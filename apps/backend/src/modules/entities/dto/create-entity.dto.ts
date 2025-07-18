import { IsString, IsOptional, IsEnum, IsUUID } from "class-validator";
import { BillingModel } from "../../../common/enums/user-roles.enum";

export class CreateEntityDto {
  @IsUUID()
  organizationId: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BillingModel)
  billingModel: BillingModel;
}
