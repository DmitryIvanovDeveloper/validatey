import { injectable } from 'inversify';
import { LoggerPort } from './ports/logger.port';

@injectable()
export class ConsoleLogger implements LoggerPort {
  info(message: string, data?: unknown): void {
    console.log(`[INFO] ${message}`, data);
  }

  error(message: string, data?: unknown): void {
    console.error(`[ERROR] ${message}`, data);
  }

  warn(message: string, data?: unknown): void {
    console.warn(`[WARN] ${message}`, data);
  }

  debug(message: string, data?: unknown): void {
    console.debug(`[DEBUG] ${message}`, data);
  }
}
