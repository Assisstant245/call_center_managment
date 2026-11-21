import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const publicUser = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: publicUser,
      orderBy: { id: "asc" },
    });
  }

  async me(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: publicUser,
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateRole(id: number, role: string) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException("User not found");

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: publicUser,
    });
  }
}
