import { ConflictException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";
import { SignupDto } from "./dto/signup.dto";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(signupDto: SignupDto) {
    const name = signupDto.name.trim();
    const email = signupDto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    // The very first account becomes the administrator; everyone else starts
    // as a plain "agent" and can be promoted by an admin (PATCH /users/:id/role).
    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? "admin" : "agent";

    const user = await this.prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });

    // Link to an existing agent profile with the same email (if any)
    await this.prisma.agent.updateMany({
      where: { email, userId: null },
      data: { userId: user.id },
    });

    return {
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
