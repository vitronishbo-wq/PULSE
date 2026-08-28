import { OfflineSyncItem } from '../types/pulse';

export class OfflineSyncEngine {
  private queue: OfflineSyncItem[] = [];
  private isOnline = true;
  private onQueueChange?: (queue: OfflineSyncItem[], isOnline: boolean) => void;

  constructor() {
    // Load persisted sync queue if available
    try {
      const stored = localStorage.getItem('pulse_offline_sync_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {
      // browser storage fallback
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setOnlineStatus(true));
      window.addEventListener('offline', () => this.setOnlineStatus(false));
    }
  }

  public setListener(cb: (queue: OfflineSyncItem[], isOnline: boolean) => void) {
    this.onQueueChange = cb;
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  public setOnlineStatus(online: boolean) {
    this.isOnline = online;
    if (this.onQueueChange) {
      this.onQueueChange(this.queue, this.isOnline);
    }
    if (online) {
      this.triggerSync();
    }
  }

  public getQueue(): OfflineSyncItem[] {
    return [...this.queue];
  }

  public enqueue(item: Omit<OfflineSyncItem, 'id' | 'status' | 'clientTimestamp'>): OfflineSyncItem {
    const syncItem: OfflineSyncItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: this.isOnline ? 'SYNCED' : 'PENDING',
      clientTimestamp: new Date().toISOString(),
      serverTimestamp: this.isOnline ? new Date().toISOString() : undefined,
    };

    this.queue.unshift(syncItem);
    this.persist();

    if (this.onQueueChange) {
      this.onQueueChange(this.queue, this.isOnline);
    }

    return syncItem;
  }

  public async triggerSync(): Promise<{ synced: number; conflicts: number }> {
    let synced = 0;
    let conflicts = 0;

    for (const item of this.queue) {
      if (item.status === 'PENDING') {
        item.status = 'SYNCING';
        // Simulate remote server validation
        await new Promise((r) => setTimeout(r, 200));

        // Simulated conflict edge-case if version > 5
        if (item.version > 5) {
          item.status = 'CONFLICT';
          item.conflictDetails = '409_CONFLICT: A versão remota no servidor difere da versão local gravada em offline.';
          conflicts++;
        } else {
          item.status = 'SYNCED';
          item.serverTimestamp = new Date().toISOString();
          synced++;
        }
      }
    }

    this.persist();
    if (this.onQueueChange) {
      this.onQueueChange(this.queue, this.isOnline);
    }

    return { synced, conflicts };
  }

  public resolveConflict(id: string, resolution: 'OVERRIDE_LOCAL' | 'ACCEPT_REMOTE'): void {
    const item = this.queue.find((q) => q.id === id);
    if (item) {
      item.status = 'SYNCED';
      item.conflictDetails = undefined;
      item.serverTimestamp = new Date().toISOString();
      this.persist();
      if (this.onQueueChange) {
        this.onQueueChange(this.queue, this.isOnline);
      }
    }
  }

  public clearSynced(): void {
    this.queue = this.queue.filter((q) => q.status !== 'SYNCED');
    this.persist();
    if (this.onQueueChange) {
      this.onQueueChange(this.queue, this.isOnline);
    }
  }

  private persist(): void {
    try {
      localStorage.setItem('pulse_offline_sync_queue', JSON.stringify(this.queue.slice(0, 50)));
    } catch {
      // ignore
    }
  }
}
