import type { EventName, EventPayloadMap } from '@/types';

type Listener<T extends EventName> = (payload: EventPayloadMap[T]) => void;

class EventBus {
  private listeners = new Map<EventName, Set<Listener<EventName>>>();

  on<T extends EventName>(event: T, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<EventName>);
    return () => this.off(event, listener);
  }

  off<T extends EventName>(event: T, listener: Listener<T>): void {
    this.listeners.get(event)?.delete(listener as Listener<EventName>);
  }

  emit<T extends EventName>(event: T, payload: EventPayloadMap[T]): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(payload);
      } catch (err) {
        console.error(`[EventBus] Listener error for ${event}:`, err);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBus();
export default eventBus;
