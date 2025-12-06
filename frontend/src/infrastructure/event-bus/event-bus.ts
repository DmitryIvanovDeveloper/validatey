import { injectable, inject } from 'inversify';
import { EventBusPort } from './ports/event-bus.port';
import { IEvent, IAsyncEventHandler, ISyncEventHandler } from './ports/event-handler.port';
import { container } from '../bootstrap/container';

@injectable()
export class EventBus implements EventBusPort {
  private listeners: Map<string, Set<(data?: any) => void>> = new Map();
  private handlers: Map<string, (ISyncEventHandler<IEvent> | IAsyncEventHandler<IEvent>)[]> = new Map();

  // Legacy API для обратной совместимости
  emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  on(event: string, callback: (data?: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data?: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  // Новый API для типизированных событий
  publish<TEvent extends IEvent>(event: TEvent): void {
    const eventType = (event as any).type ?? event.constructor.name;
    const handlers = this.handlers.get(eventType) || [];

    // Обработка подписанных handlers
    for (const handler of handlers) {
      if ('handle' in handler && (handler as ISyncEventHandler<TEvent>).canHandle(event)) {
        (handler as ISyncEventHandler<TEvent>).handle(event);
      }
    }

    // Получение handlers из DI контейнера
    const fromContainer = container.getAll<ISyncEventHandler<TEvent>>(
      Symbol.for(`ISyncEventHandler<${eventType}>`),
    );

    for (const handler of fromContainer) {
      if (handler.canHandle(event)) {
        handler.handle(event);
      }
    }
  }

  async publishAsync<TEvent extends IEvent>(event: TEvent): Promise<void> {
    const eventType = (event as any).type ?? event.constructor.name;
    const handlers = this.handlers.get(eventType) || [];
    const tasks: Promise<void>[] = [];

    // Обработка подписанных handlers
    for (const handler of handlers) {
      if ('handleAsync' in handler && (handler as IAsyncEventHandler<TEvent>).canHandle(event)) {
        tasks.push((handler as IAsyncEventHandler<TEvent>).handleAsync(event));
      }
    }

    // Получение handlers из DI контейнера
    const asyncHandlers = container.getAll<IAsyncEventHandler<TEvent>>(
      Symbol.for(`IAsyncEventHandler<${eventType}>`),
    );

    for (const handler of asyncHandlers) {
      if (handler.canHandle(event)) {
        tasks.push(handler.handleAsync(event));
      }
    }

    if (tasks.length > 0) {
      await Promise.all(tasks);
    }
  }

  subscribe<TEvent extends IEvent>(handler: ISyncEventHandler<TEvent> | IAsyncEventHandler<TEvent>): void {
    const eventType = this.extractGenericType(handler);
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as any);
  }

  unsubscribe<TEvent extends IEvent>(handler: ISyncEventHandler<TEvent> | IAsyncEventHandler<TEvent>): void {
    const eventType = this.extractGenericType(handler);
    const list = this.handlers.get(eventType);
    if (list) {
      const index = list.indexOf(handler as any);
      if (index > -1) {
        list.splice(index, 1);
      }
    }
  }

  private extractGenericType(handler: any): string {
    const name = handler.constructor.name;
    const match = /Handler<(.*?)>/.exec(name);
    return match ? match[1] : 'UnknownEvent';
  }
}
