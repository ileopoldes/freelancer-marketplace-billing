import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsUUID,
} from "class-validator";

export enum UserRole {
  ADMIN = "ADMIN",
  USER = "USER",
  FREELANCER = "FREELANCER",
  TEAM_LEAD = "TEAM_LEAD",
  ORGANIZATION_ADMIN = "ORGANIZATION_ADMIN",
  ENTITY_ADMIN = "ENTITY_ADMIN",
}

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  username: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}
