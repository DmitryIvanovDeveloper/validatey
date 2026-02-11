import { injectable } from 'inversify';
import { EventBusPort } from './ports/event-bus.port';

@injectable()
export class EventBus implements EventBusPort {
  private listeners: Map<string, Set<(data?: unknown) => void>> = new Map();

  emit(event: string, data?: unknown): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      console.log(`📢 EventBus: Emitting event "${event}" to ${eventListeners.size} listener(s)`);
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ EventBus: Error in listener for "${event}":`, error);
        }
      });
    } else {
      console.warn(`⚠️ EventBus: No listeners for event "${event}"`);
    }
  }

  on(event: string, callback: (data?: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    console.log(`📝 EventBus: Registered listener for "${event}" (total: ${this.listeners.get(event)!.size})`);
  }

  off(event: string, callback: (data?: unknown) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }
}
