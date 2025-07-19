import {
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/auth.guard";
import { Public } from "./decorators/public.decorator";
import { IsString, IsNotEmpty, Validate } from "class-validator";
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "isEmailOrUsername", async: false })
export class IsEmailOrUsernameConstraint
  implements ValidatorConstraintInterface
{
  validate(text: string, args: ValidationArguments) {
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      typeof text === "string" && (emailRegex.test(text) || text.length > 0)
    );
  }
  defaultMessage(args: ValidationArguments) {
    return "emailOrUsername must be a valid email or non-empty username";
  }
}

export class LoginDto {
  @Validate(IsEmailOrUsernameConstraint)
  emailOrUsername: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout() {
    // For JWT, logout is typically handled client-side by removing the token
    // But you could implement token blacklisting here if needed
    return { message: "Logged out successfully" };
  }

  @Get("me")
  async getCurrentUser(@Request() req) {
    // req.user is populated by the JWT strategy after token validation
    return req.user;
  }
}
