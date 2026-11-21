import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from "@nestjs/common";
import { IsIn } from "class-validator";

import { UsersService } from "./users.service";
import { Roles } from "../common/security/roles.decorator";
import { ALL_ROLES } from "../common/security/roles";
import {
  CurrentUser,
  type AuthUser,
} from "../common/security/current-user.decorator";

class UpdateRoleDto {
  @IsIn([...ALL_ROLES])
  role: string;
}

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.me(user.sub);
  }

  @Roles("admin")
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Roles("admin")
  @Patch(":id/role")
  updateRole(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, dto.role);
  }
}
