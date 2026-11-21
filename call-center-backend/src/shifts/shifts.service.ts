import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";
import { CreateShiftDto } from "./dto/create-shift.dto";

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateShiftDto) {
    return this.prisma.shift.create({
      data: {
        name: dto.name,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        breakMinutes: dto.breakMinutes ?? null,
        status: dto.status || "Active",
      },
    });
  }

  findAll() {
    return this.prisma.shift.findMany({ orderBy: { id: "desc" } });
  }
}
