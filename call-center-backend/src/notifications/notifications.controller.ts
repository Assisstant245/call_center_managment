import { Controller, Get, Param, ParseIntPipe, Patch } from "@nestjs/common";

import { NotificationsService } from "./notifications.service";
import {
  CurrentUser,
  type AuthUser,
} from "../common/security/current-user.decorator";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.listForUser(user.sub);
  }

  @Patch("read-all")
  readAll(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user.sub);
  }

  @Patch(":id/read")
  read(@CurrentUser() user: AuthUser, @Param("id", ParseIntPipe) id: number) {
    return this.notifications.markRead(user.sub, id);
  }
}
