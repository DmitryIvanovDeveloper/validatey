export interface EventBusPort {
  emit(event: string, data?: unknown): void;
  on(event: string, callback: (data?: unknown) => void): void;
  off(event: string, callback: (data?: unknown) => void): void;
}
