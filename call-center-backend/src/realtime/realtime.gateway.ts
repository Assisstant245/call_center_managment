import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";

/**
 * WebSocket gateway for live dashboards. Clients must send their JWT in
 * `auth.token` when connecting (socket.io handshake).
 */
@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(","),
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      client.handshake.headers.authorization?.replace("Bearer ", "");

    try {
      if (!token) throw new Error("missing token");
      client.data.user = await this.jwtService.verifyAsync(token);
    } catch {
      this.logger.debug("Rejected unauthenticated socket");
      client.disconnect(true);
    }
  }

  emit(event: string, payload: unknown) {
    this.server?.emit(event, payload);
  }
}
