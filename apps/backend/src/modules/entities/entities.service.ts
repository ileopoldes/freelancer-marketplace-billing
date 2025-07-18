import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateEntityDto } from "./dto/create-entity.dto";
import { UpdateEntityDto } from "./dto/update-entity.dto";

@Injectable()
export class EntitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createEntityDto: CreateEntityDto) {
    try {
      // Verify organization exists
      const organization = await this.prisma.organization.findUnique({
        where: { id: createEntityDto.organizationId },
      });

      if (!organization) {
        throw new NotFoundException("Organization not found");
      }

      const entity = await this.prisma.entity.create({
        data: {
          organizationId: createEntityDto.organizationId,
          name: createEntityDto.name,
          description: createEntityDto.description,
          billingModel: createEntityDto.billingModel,
          status: "ACTIVE",
        },
        include: {
          organization: true,
        },
      });

      // Create initial credit balance for entities with credit-based billing
      if (createEntityDto.billingModel === "PREPAID_CREDITS") {
        await this.prisma.entityCreditBalance.create({
          data: {
            entityId: entity.id,
            totalCredits: 0,
            usedCredits: 0,
          },
        });
      }

      return entity;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("Failed to create entity");
    }
  }

  async findAll() {
    return this.prisma.entity.findMany({
      include: {
        organization: true,
        teams: true,
        entityUsers: {
          include: {
            user: true,
          },
        },
        creditBalances: true,
        subscriptions: true,
      },
    });
  }

  async findOne(id: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id },
      include: {
        organization: true,
        teams: true,
        entityUsers: {
          include: {
            user: true,
          },
        },
        creditBalances: true,
        subscriptions: true,
      },
    });

    if (!entity) {
      throw new NotFoundException("Entity not found");
    }

    return entity;
  }

  async findByOrganization(organizationId: string) {
    return this.prisma.entity.findMany({
      where: { organizationId },
      include: {
        teams: true,
        entityUsers: {
          include: {
            user: true,
          },
        },
        creditBalances: true,
        subscriptions: true,
      },
    });
  }

  async update(id: string, updateEntityDto: UpdateEntityDto) {
    const entity = await this.findOne(id);

    try {
      // If billing model is changing to prepaid credits, ensure credit balance exists
      if (
        updateEntityDto.billingModel === "PREPAID_CREDITS" &&
        entity.billingModel !== "PREPAID_CREDITS"
      ) {
        const existingBalance = await this.prisma.entityCreditBalance.findFirst(
          {
            where: { entityId: id },
          },
        );

        if (!existingBalance) {
          await this.prisma.entityCreditBalance.create({
            data: {
              entityId: id,
              totalCredits: 0,
              usedCredits: 0,
            },
          });
        }
      }

      const updatedEntity = await this.prisma.entity.update({
        where: { id },
        data: {
          name: updateEntityDto.name,
          description: updateEntityDto.description,
          billingModel: updateEntityDto.billingModel,
        },
        include: {
          organization: true,
          creditBalances: true,
          subscriptions: true,
        },
      });

      return updatedEntity;
    } catch (_error) {
      throw new BadRequestException("Failed to update entity");
    }
  }

  async remove(id: string) {
    const _entity = await this.findOne(id);

    try {
      await this.prisma.entity.delete({
        where: { id },
      });
      return { message: "Entity deleted successfully" };
    } catch (_error) {
      throw new BadRequestException("Failed to delete entity");
    }
  }

  async hasAccess(entityId: string): Promise<boolean> {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      include: {
        creditBalances: true,
        subscriptions: true,
      },
    });

    if (!entity) {
      return false;
    }

    // Check if entity has access based on billing model
    switch (entity.billingModel) {
      case "PREPAID_CREDITS": {
        const creditBalance = entity.creditBalances[0];
        return (
          creditBalance &&
          creditBalance.totalCredits > creditBalance.usedCredits
        );
      }

      case "SEAT_BASED": {
        const activeSubscription = entity.subscriptions.find(
          (sub) => sub.status === "ACTIVE",
        );
        return !!activeSubscription;
      }

      case "PAY_AS_YOU_GO":
        // Pay as you go always has access (charges after usage)
        return true;

      default:
        return false;
    }
  }
}
