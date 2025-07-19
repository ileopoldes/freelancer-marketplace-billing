import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUserDto, UserRole } from "./dto/create-user.dto";
import * as bcrypt from "bcrypt";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(createUserDto: CreateUserDto) {
    const {
      firstName,
      lastName,
      email,
      username,
      password,
      role,
      organizationId,
      entityId,
    } = createUserDto;

    // Check if username or email already exist
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException(`User with email ${email} already exists`);
      }
      if (existingUser.username === username) {
        throw new ConflictException(`Username ${username} is already taken`);
      }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await this.prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        username,
        email,
        password: hashedPassword,
        globalRole: role,
      },
    });

    // Associate with entity if provided
    if (entityId) {
      await this.prisma.entityUser.create({
        data: {
          user: {
            connect: { id: newUser.id },
          },
          entity: {
            connect: { id: entityId },
          },
          role,
          seatAllocation: 1,
        },
      });
    } else if (organizationId) {
      // For now, associate directly with organization
      // In a real-world scenario, you would have a separate OrganizationUser table
    }

    // Create customer record
    await this.prisma.customer.create({
      data: {
        id: newUser.id, // Use user ID as customer ID
        name: `${firstName} ${lastName}`,
        email,
      },
    });

    const { password: _, ...user } = newUser;
    return user;
  }

  async getUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((user) => {
        const { password, ...rest } = user;
        return rest;
      }),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByUsername(username: string) {
    return this.prisma.user.findFirst({ where: { username } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email } });
  }

  async findByEmailOrUsername(emailOrUsername: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
