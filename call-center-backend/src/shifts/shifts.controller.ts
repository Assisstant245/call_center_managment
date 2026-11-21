import { Body, Controller, Get, Post } from "@nestjs/common";

import { ShiftsService } from "./shifts.service";
import { CreateShiftDto } from "./dto/create-shift.dto";
import { Roles } from "../common/security/roles.decorator";
import { MANAGEMENT_ROLES } from "../common/security/roles";

@Controller("shifts")
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Roles(...MANAGEMENT_ROLES)
  @Post()
  async create(@Body() createShiftDto: CreateShiftDto) {
    const shift = await this.shiftsService.create(createShiftDto);
    return {
      status: "success",
      message: "Shift created successfully",
      data: shift,
    };
  }

  @Get()
  async findAll() {
    const shifts = await this.shiftsService.findAll();
    return {
      status: "success",
      message: "Shifts fetched successfully",
      data: shifts,
    };
  }
}
