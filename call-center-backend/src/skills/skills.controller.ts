import { Body, ConflictException, Controller, Get, Post } from "@nestjs/common";

import { SkillsService } from "./skills.service";
import { CreateSkillDto } from "./dto/create-skill.dto";
import { Roles } from "../common/security/roles.decorator";
import { MANAGEMENT_ROLES } from "../common/security/roles";

@Controller("skills")
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Roles(...MANAGEMENT_ROLES)
  @Post()
  async create(@Body() createSkillDto: CreateSkillDto) {
    if (await this.skillsService.exists(createSkillDto.name)) {
      throw new ConflictException("A skill with this name already exists");
    }

    const skill = await this.skillsService.create(createSkillDto);
    return {
      status: "success",
      message: "Skill created successfully",
      data: skill,
    };
  }

  @Get()
  findAll() {
    return this.skillsService.findAll();
  }
}
