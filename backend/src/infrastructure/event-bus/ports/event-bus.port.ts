export interface EventBusPort {
  emit(event: string, data?: any): void;
  on(event: string, callback: (data?: any) => void): void;
  off(event: string, callback: (data?: any) => void): void;
}
