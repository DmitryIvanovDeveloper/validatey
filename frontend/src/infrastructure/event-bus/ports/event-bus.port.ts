import { IEvent, IAsyncEventHandler, ISyncEventHandler } from './event-handler.port';

export interface EventBusPort {
  // Legacy API для обратной совместимости
  emit(event: string, data?: unknown): void;
  on(event: string, callback: (data?: unknown) => void): void;
  off(event: string, callback: (data?: unknown) => void): void;
  
  // Новый API для типизированных событий
  publish<TEvent extends IEvent>(event: TEvent): void;
  publishAsync<TEvent extends IEvent>(event: TEvent): Promise<void>;
  subscribe<TEvent extends IEvent>(handler: ISyncEventHandler<TEvent> | IAsyncEventHandler<TEvent>): void;
  unsubscribe<TEvent extends IEvent>(handler: ISyncEventHandler<TEvent> | IAsyncEventHandler<TEvent>): void;
}
