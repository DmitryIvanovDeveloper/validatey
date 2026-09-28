export interface Logger {
  info(event: string, payload?: Record<string, unknown>): void;
  warn(event: string, payload?: Record<string, unknown>): void;
  error(event: string, payload?: Record<string, unknown>): void;
}

class ConsoleLogger implements Logger {
  info(event: string, payload?: Record<string, unknown>): void {
    console.log(`[insights][info] ${event}`, payload ?? {});
  }
  warn(event: string, payload?: Record<string, unknown>): void {
    console.warn(`[insights][warn] ${event}`, payload ?? {});
  }
  error(event: string, payload?: Record<string, unknown>): void {
    console.error(`[insights][error] ${event}`, payload ?? {});
  }
}

export const logger: Logger = new ConsoleLogger();
