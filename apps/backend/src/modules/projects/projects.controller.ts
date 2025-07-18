import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UseFilters,
  UseGuards,
  Query,
} from "@nestjs/common";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { HttpExceptionFilter } from "../../common/filters/http-exception.filter";
import { BillingAccessGuard } from "../../guards/billing-access.guard";
import { BillingAccess } from "../../decorators/billing-access.decorator";

@Controller("projects")
@UseFilters(HttpExceptionFilter)
@UseGuards(BillingAccessGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @BillingAccess({ featureName: "project_creation" })
  create(@Body(ValidationPipe) createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  findAll(@Query("entityId") entityId?: string) {
    return this.projectsService.findAll(entityId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(ValidationPipe) updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.projectsService.remove(id);
  }

  @Post(":id/assign-freelancer")
  @HttpCode(HttpStatus.CREATED)
  @BillingAccess({ featureName: "project_assignment" })
  assignFreelancer(
    @Param("id") projectId: string,
    @Body(ValidationPipe)
    body: { freelancerId: string; clientId: string; amount: number },
  ) {
    return this.projectsService.assignFreelancer(
      projectId,
      body.freelancerId,
      body.clientId,
      body.amount,
    );
  }
}
