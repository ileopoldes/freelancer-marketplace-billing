import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { EntitiesService } from "../entities/entities.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectStatus } from "../../common/enums/user-roles.enum";

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private entitiesService: EntitiesService,
  ) {}

  async create(createProjectDto: CreateProjectDto) {
    try {
      // Check if entity exists and user has access
      const _entity = await this.entitiesService.findOne(
        createProjectDto.entityId,
      );
      const hasAccess = await this.entitiesService.hasAccess(
        createProjectDto.entityId,
      );

      if (!hasAccess) {
        throw new ForbiddenException(
          "Entity does not have access to create projects. Check billing status.",
        );
      }

      // Verify creator exists
      const creator = await this.prisma.user.findUnique({
        where: { id: createProjectDto.createdById },
      });

      if (!creator) {
        throw new NotFoundException("Creator not found");
      }

      // Verify assignee exists if provided
      if (createProjectDto.assignedTo) {
        const assignee = await this.prisma.user.findUnique({
          where: { id: createProjectDto.assignedTo },
        });

        if (!assignee) {
          throw new NotFoundException("Assignee not found");
        }
      }

      const project = await this.prisma.project.create({
        data: {
          entityId: createProjectDto.entityId,
          title: createProjectDto.title,
          description: createProjectDto.description,
          budget: createProjectDto.budget,
          currency: createProjectDto.currency || "USD",
          createdById: createProjectDto.createdById,
          assignedTo: createProjectDto.assignedTo,
          startDate: createProjectDto.startDate
            ? new Date(createProjectDto.startDate)
            : null,
          endDate: createProjectDto.endDate
            ? new Date(createProjectDto.endDate)
            : null,
          metadata: createProjectDto.metadata,
          status: "DRAFT",
        },
        include: {
          entity: {
            include: {
              organization: true,
            },
          },
          createdBy: true,
          assignedUser: true,
        },
      });

      // Create marketplace event for project creation
      await this.prisma.marketplaceEvent.create({
        data: {
          entityId: createProjectDto.entityId,
          userId: createProjectDto.createdById,
          eventType: "PROJECT_CREATED",
          quantity: 1,
          unitPrice: createProjectDto.budget,
          metadata: {
            projectId: project.id,
            projectTitle: project.title,
          },
        },
      });

      return project;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException("Failed to create project");
    }
  }

  async findAll(entityId?: string) {
    const whereClause = entityId ? { entityId } : {};

    return this.prisma.project.findMany({
      where: whereClause,
      include: {
        entity: {
          include: {
            organization: true,
          },
        },
        createdBy: true,
        assignedUser: true,
        contracts: {
          include: {
            freelancer: true,
            client: true,
          },
        },
        _count: {
          select: {
            contracts: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        entity: {
          include: {
            organization: true,
          },
        },
        createdBy: true,
        assignedUser: true,
        contracts: {
          include: {
            freelancer: true,
            client: true,
          },
        },
        walletTransactions: true,
      },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const project = await this.findOne(id);

    try {
      // Check if status is changing to completed
      if (
        updateProjectDto.status === ProjectStatus.COMPLETED &&
        project.status !== ProjectStatus.COMPLETED
      ) {
        updateProjectDto.completedAt = new Date().toISOString();
      }

      const updatedProject = await this.prisma.project.update({
        where: { id },
        data: {
          title: updateProjectDto.title,
          description: updateProjectDto.description,
          budget: updateProjectDto.budget,
          currency: updateProjectDto.currency,
          assignedTo: updateProjectDto.assignedTo,
          startDate: updateProjectDto.startDate
            ? new Date(updateProjectDto.startDate)
            : undefined,
          endDate: updateProjectDto.endDate
            ? new Date(updateProjectDto.endDate)
            : undefined,
          status: updateProjectDto.status,
          completedAt: updateProjectDto.completedAt
            ? new Date(updateProjectDto.completedAt)
            : undefined,
          metadata: updateProjectDto.metadata,
        },
        include: {
          entity: {
            include: {
              organization: true,
            },
          },
          createdBy: true,
          assignedUser: true,
          contracts: {
            include: {
              freelancer: true,
              client: true,
            },
          },
        },
      });

      // Create marketplace event for status changes
      if (
        updateProjectDto.status &&
        updateProjectDto.status !== project.status
      ) {
        await this.prisma.marketplaceEvent.create({
          data: {
            entityId: project.entityId,
            userId: project.createdById,
            eventType: this.getEventTypeForStatus(updateProjectDto.status),
            quantity: 1,
            unitPrice: project.budget,
            metadata: {
              projectId: project.id,
              projectTitle: project.title,
              oldStatus: project.status,
              newStatus: updateProjectDto.status,
            },
          },
        });
      }

      return updatedProject;
    } catch (_error) {
      throw new BadRequestException("Failed to update project");
    }
  }

  async remove(id: string) {
    const _project = await this.findOne(id);

    try {
      await this.prisma.project.delete({
        where: { id },
      });
      return { message: "Project deleted successfully" };
    } catch (_error) {
      throw new BadRequestException("Failed to delete project");
    }
  }

  async assignFreelancer(
    projectId: string,
    freelancerId: string,
    clientId: string,
    amount: number,
  ) {
    const project = await this.findOne(projectId);

    try {
      // Verify freelancer exists
      const freelancer = await this.prisma.user.findUnique({
        where: { id: freelancerId },
      });

      if (!freelancer) {
        throw new NotFoundException("Freelancer not found");
      }

      // Verify client exists
      const client = await this.prisma.user.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new NotFoundException("Client not found");
      }

      // Create contract
      const contract = await this.prisma.projectContract.create({
        data: {
          projectId,
          freelancerId,
          clientId,
          amount,
          currency: project.currency,
          status: "ACTIVE",
          startDate: new Date(),
        },
        include: {
          project: true,
          freelancer: true,
          client: true,
        },
      });

      // Update project status and assignment
      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          assignedTo: freelancerId,
          status: ProjectStatus.IN_PROGRESS,
        },
      });

      // Create marketplace event
      await this.prisma.marketplaceEvent.create({
        data: {
          entityId: project.entityId,
          userId: freelancerId,
          eventType: "FREELANCER_HIRED",
          quantity: 1,
          unitPrice: amount,
          metadata: {
            projectId,
            contractId: contract.id,
            freelancerId,
            clientId,
          },
        },
      });

      return contract;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("Failed to assign freelancer");
    }
  }

  private getEventTypeForStatus(status: ProjectStatus): string {
    switch (status) {
      case ProjectStatus.OPEN:
        return "PROJECT_CREATED";
      case ProjectStatus.IN_PROGRESS:
        return "PROJECT_ASSIGNED";
      case ProjectStatus.COMPLETED:
        return "PROJECT_COMPLETED";
      default:
        return "PROJECT_CREATED";
    }
  }
}
