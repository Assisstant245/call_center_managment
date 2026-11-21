import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateSkillDto } from "./dto/create-skill.dto";

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async exists(name: string) {
    const found = await this.prisma.skill.findFirst({
      where: { name: { equals: name.trim(), mode: "insensitive" } },
    });
    return found !== null;
  }

  create(dto: CreateSkillDto) {
    return this.prisma.skill.create({
      data: {
        name: dto.name.trim(),
        description: dto.description || null,
        status: dto.status || "Active",
      },
    });
  }

  async findAll() {
    const skills = await this.prisma.skill.findMany({ orderBy: { id: "desc" } });
    return { status: "success", data: skills };
  }
}
