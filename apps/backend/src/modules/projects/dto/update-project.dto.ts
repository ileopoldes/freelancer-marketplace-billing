import { PartialType } from "@nestjs/mapped-types";
import { CreateProjectDto } from "./create-project.dto";
import { IsEnum, IsOptional, IsDateString } from "class-validator";
import { ProjectStatus } from "../../../common/enums/user-roles.enum";

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsDateString()
  @IsOptional()
  completedAt?: string;
}
