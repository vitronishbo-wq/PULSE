import { SystemEvent, EventType } from '../types/pulse';

type EventHandler = (event: SystemEvent) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private subscribers: Map<string, Set<EventHandler>> = new Map();
  private eventLog: SystemEvent[] = [];
  private listeners: ((event: SystemEvent) => void)[] = [];

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public subscribe(eventType: EventType | '*', handler: EventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);

    return () => {
      this.subscribers.get(eventType)?.delete(handler);
    };
  }

  public onAnyEvent(listener: (event: SystemEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public publish(
    eventData: Omit<SystemEvent, 'eventId' | 'timestamp' | 'version'>
  ): SystemEvent {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullEvent: SystemEvent = {
      ...eventData,
      eventId,
      timestamp: new Date().toISOString(),
      version: (this.eventLog.length + 1),
      sideEffects: eventData.sideEffects || [],
    };

    // Append to immutable event ledger
    this.eventLog.unshift(fullEvent);

    // Notify specific type subscribers
    const typeSubs = this.subscribers.get(fullEvent.eventType);
    if (typeSubs) {
      typeSubs.forEach((handler) => {
        try {
          handler(fullEvent);
        } catch (err) {
          console.error(`[EventBus] Handler error on ${fullEvent.eventType}:`, err);
        }
      });
    }

    // Notify wildcard '*' subscribers
    const allSubs = this.subscribers.get('*');
    if (allSubs) {
      allSubs.forEach((handler) => {
        try {
          handler(fullEvent);
        } catch (err) {
          console.error(`[EventBus] Wildcard handler error:`, err);
        }
      });
    }

    // Notify UI reactive listeners
    this.listeners.forEach((l) => l(fullEvent));

    return fullEvent;
  }

  public getEventHistory(): SystemEvent[] {
    return [...this.eventLog];
  }

  public getHistory(): SystemEvent[] {
    return this.getEventHistory();
  }

  public clearHistory(): void {
    this.eventLog = [];
  }
}
