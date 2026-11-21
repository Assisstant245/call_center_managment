import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

/**
 * Thin wrapper over Redis used for real-time queue metrics.
 * When REDIS_URL is not set (or Redis is down) it transparently falls back
 * to an in-memory Map so the app keeps working in development.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memory = new Map<string, Record<string, string>>();

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn("REDIS_URL not set - using in-memory metrics store");
      return;
    }

    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 3 ? null : times * 500),
    });
    this.client.on("error", (err) =>
      this.logger.warn(`Redis error: ${err.message}`),
    );
  }

  get usingRedis(): boolean {
    return this.client !== null && this.client.status === "ready";
  }

  async setHash(key: string, value: Record<string, string | number>) {
    const flat: Record<string, string> = {};
    for (const [k, v] of Object.entries(value)) flat[k] = String(v);

    if (this.usingRedis) {
      try {
        await this.client!.hset(key, flat);
        await this.client!.expire(key, 60 * 60 * 24);
        return;
      } catch (err) {
        this.logger.warn(`Redis hset failed, using memory: ${String(err)}`);
      }
    }
    this.memory.set(key, { ...(this.memory.get(key) ?? {}), ...flat });
  }

  async getHashes(
    prefix: string,
  ): Promise<Record<string, Record<string, string>>> {
    if (this.usingRedis) {
      try {
        const result: Record<string, Record<string, string>> = {};
        let cursor = "0";
        do {
          const [next, keys] = await this.client!.scan(
            cursor,
            "MATCH",
            `${prefix}*`,
            "COUNT",
            100,
          );
          cursor = next;
          for (const key of keys) result[key] = await this.client!.hgetall(key);
        } while (cursor !== "0");
        return result;
      } catch (err) {
        this.logger.warn(`Redis scan failed, using memory: ${String(err)}`);
      }
    }

    const result: Record<string, Record<string, string>> = {};
    for (const [key, value] of this.memory) {
      if (key.startsWith(prefix)) result[key] = value;
    }
    return result;
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }
}
