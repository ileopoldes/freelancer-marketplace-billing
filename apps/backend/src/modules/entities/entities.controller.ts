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
  Query,
} from "@nestjs/common";
import { EntitiesService } from "./entities.service";
import { CreateEntityDto } from "./dto/create-entity.dto";
import { UpdateEntityDto } from "./dto/update-entity.dto";
import { HttpExceptionFilter } from "../../common/filters/http-exception.filter";

@Controller("entities")
@UseFilters(HttpExceptionFilter)
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(ValidationPipe) createEntityDto: CreateEntityDto) {
    return this.entitiesService.create(createEntityDto);
  }

  @Get()
  findAll(@Query("organizationId") organizationId?: string) {
    if (organizationId) {
      return this.entitiesService.findByOrganization(organizationId);
    }
    return this.entitiesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.entitiesService.findOne(id);
  }

  @Get(":id/access")
  checkAccess(@Param("id") id: string) {
    return this.entitiesService.hasAccess(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body(ValidationPipe) updateEntityDto: UpdateEntityDto,
  ) {
    return this.entitiesService.update(id, updateEntityDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.entitiesService.remove(id);
  }
}
