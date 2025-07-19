import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator'
import { BillingModel } from '../../../common/enums/user-roles.enum'

export class CreateEntityDto {
  @IsString()
  @IsNotEmpty()
  organizationId: string

  @IsString()
  name: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(BillingModel)
  billingModel: BillingModel
}
