import { IsString, IsUUID } from "class-validator";

export class PurchaseCreditsDto {
  @IsUUID()
  entityId: string;

  @IsString()
  packageId: string;

  @IsUUID()
  purchasedByUserId: string;
}
