import { Injectable, Logger } from "@nestjs/common";

/**
 * HTTP client for the Python forecasting service (FastAPI).
 * Base URL: FORECAST_SERVICE_URL (default http://localhost:8000)
 * Optional shared secret: FORECAST_API_KEY
 */
@Injectable()
export class ForecastClient {
  private readonly logger = new Logger(ForecastClient.name);

  private get baseUrl() {
    return (process.env.FORECAST_SERVICE_URL ?? "http://localhost:8000").replace(
      /\/$/,
      "",
    );
  }

  async post<T>(path: string, body: unknown, timeoutMs = 120_000): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.FORECAST_API_KEY
            ? { "X-API-Key": process.env.FORECAST_API_KEY }
            : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Forecast service ${response.status}: ${detail}`);
      }
      return (await response.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async isUp(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      this.logger.debug("Forecast service not reachable");
      return false;
    }
  }
}
