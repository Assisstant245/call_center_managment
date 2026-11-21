import { Injectable, Logger } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { MANAGEMENT_ROLES } from "../common/security/roles";

export interface NotifyInput {
  /** Recipient user. Omit to notify all managers/admins/planners. */
  userId?: number;
  title: string;
  message: string;
  type?: "info" | "success" | "warning";
}

/**
 * Creates in-app notifications, pushes them over WebSocket and (when SMTP_*
 * variables are configured) sends an e-mail copy.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly transporter: Transporter | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RealtimeGateway,
  ) {
    this.transporter = process.env.SMTP_HOST
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: process.env.SMTP_SECURE === "true",
          auth: process.env.SMTP_USER
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
        })
      : null;

    if (!this.transporter) {
      this.logger.warn("SMTP_HOST not set - e-mail notifications disabled");
    }
  }

  async notify(input: NotifyInput) {
    try {
      const recipients = input.userId
        ? await this.prisma.user.findMany({ where: { id: input.userId } })
        : await this.prisma.user.findMany({
            where: { role: { in: MANAGEMENT_ROLES } },
          });

      for (const user of recipients) {
        const saved = await this.prisma.notification.create({
          data: {
            userId: user.id,
            title: input.title,
            message: input.message,
            type: input.type ?? "info",
          },
        });
        this.gateway.emit("notification", saved);
        void this.sendEmail(user.email, input.title, input.message);
      }
    } catch (err) {
      // A failed notification must never break the business action.
      this.logger.warn(`Notification failed: ${String(err)}`);
    }
  }

  private async sendEmail(to: string, subject: string, text: string) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM ?? "Workforce360 <no-reply@workforce360.local>",
        to,
        subject,
        text,
      });
    } catch (err) {
      this.logger.warn(`E-mail to ${to} failed: ${String(err)}`);
    }
  }

  listForUser(userId: number) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  markRead(userId: number, id: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  markAllRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
