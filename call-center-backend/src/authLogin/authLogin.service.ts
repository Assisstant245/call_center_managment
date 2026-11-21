
import {
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthLoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const { password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    // User does not exist
    if (!user) {
      throw new UnauthorizedException(
        "Invalid email or password"
      );
    }

    // Compare entered password with hashed password
    const passwordMatched = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatched) {
      throw new UnauthorizedException(
        "Invalid email or password"
      );
    }

    // JWT payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate JWT token
    const token =
      await this.jwtService.signAsync(payload);

    return {
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}

