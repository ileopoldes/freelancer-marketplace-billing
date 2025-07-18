import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(createOrganizationDto: CreateOrganizationDto) {
    try {
      // Check if domain already exists
      if (createOrganizationDto.domain) {
        const existingOrg = await this.prisma.organization.findUnique({
          where: { domain: createOrganizationDto.domain },
        });
        if (existingOrg) {
          throw new BadRequestException("Domain already exists");
        }
      }

      const organization = await this.prisma.organization.create({
        data: {
          name: createOrganizationDto.name,
          domain: createOrganizationDto.domain,
          billingEmail: createOrganizationDto.billingEmail,
          status: "ACTIVE",
        },
      });

      // Create default entity with the billing model
      await this.prisma.entity.create({
        data: {
          organizationId: organization.id,
          name: `${organization.name} - Default Entity`,
          description:
            createOrganizationDto.description ||
            "Default entity for organization",
          billingModel: createOrganizationDto.billingModel,
        },
      });

      return organization;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Failed to create organization");
    }
  }

  async findAll() {
    return this.prisma.organization.findMany({
      include: {
        entities: {
          include: {
            teams: true,
            entityUsers: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        entities: {
          include: {
            teams: true,
            entityUsers: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException("Organization not found");
    }

    return organization;
  }

  async update(id: string, updateOrganizationDto: UpdateOrganizationDto) {
    const organization = await this.findOne(id);

    try {
      // Check if domain is being updated and doesn't conflict
      if (
        updateOrganizationDto.domain &&
        updateOrganizationDto.domain !== organization.domain
      ) {
        const existingOrg = await this.prisma.organization.findUnique({
          where: { domain: updateOrganizationDto.domain },
        });
        if (existingOrg) {
          throw new BadRequestException("Domain already exists");
        }
      }

      const updatedOrganization = await this.prisma.organization.update({
        where: { id },
        data: {
          name: updateOrganizationDto.name,
          domain: updateOrganizationDto.domain,
          billingEmail: updateOrganizationDto.billingEmail,
        },
      });

      return updatedOrganization;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Failed to update organization");
    }
  }

  async remove(id: string) {
    const _organization = await this.findOne(id);

    try {
      await this.prisma.organization.delete({
        where: { id },
      });
      return { message: "Organization deleted successfully" };
    } catch (_error) {
      throw new BadRequestException("Failed to delete organization");
    }
  }
}
