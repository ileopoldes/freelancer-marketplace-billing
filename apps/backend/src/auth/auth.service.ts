import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../modules/users/users.service";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./auth.controller";
import { User } from "@prisma/client";

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  access_token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(emailOrUsername: string, password: string): Promise<any> {
    // Find user by email or username
    const user = await this.usersService.findByEmailOrUsername(emailOrUsername);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Return user without password
    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    const user = await this.validateUser(
      loginDto.emailOrUsername,
      loginDto.password,
    );

    const payload: JwtPayload = {
      sub: user?.id,
      email: user?.email,
      username: user?.name,
      role: user?.globalRole,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user?.id,
        email: user?.email,
        username: user?.name,
        role: user?.globalRole,
      },
    };
  }

  async validateJwtPayload(payload: JwtPayload): Promise<Partial<User>> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const { password: _, ...result } = user;
    return result;
  }
}
