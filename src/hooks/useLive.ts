import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_URL } from "../helper/api";
import { getToken } from "../helper/session";

/**
 * Connects to the backend WebSocket gateway (JWT in the handshake) and
 * returns a live connection flag. Each handler is called when its event arrives.
 */
export function useLive(handlers: Record<string, (payload: any) => void>) {
  const [connected, setConnected] = useState(false);
  const ref = useRef(handlers);

  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket: Socket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    for (const event of Object.keys(ref.current)) {
      socket.on(event, (payload) => ref.current[event]?.(payload));
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  return connected;
}
