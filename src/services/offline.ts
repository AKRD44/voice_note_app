/**
 * Offline Queue Service
 * Handles offline operations and syncs when back online
 */

import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

const storage = new MMKV({ id: 'offline-queue' });

export interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries: number;
}

export class OfflineQueue {
  private static readonly QUEUE_KEY = 'pending_operations';
  private static isOnline = true;
  private static isSyncing = false;

  static initialize(): void {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('Back online, syncing queue...');
        this.syncQueue();
      }
    });
  }

  static enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): void {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      retries: 0,
    };

    const queue = this.getQueue();
    queue.push(queuedOp);
    storage.set(this.QUEUE_KEY, JSON.stringify(queue));
  }

  static getQueue(): QueuedOperation[] {
    const queueJson = storage.getString(this.QUEUE_KEY);
    return queueJson ? JSON.parse(queueJson) : [];
  }

  static async syncQueue(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    const queue = this.getQueue();
    const remaining: QueuedOperation[] = [];

    for (const op of queue) {
      try {
        await this.executeOperation(op);
        console.log(`Synced operation: ${op.type} on ${op.table}`);
      } catch (error) {
        console.error('Failed to sync operation:', error);
        op.retries++;
        if (op.retries < 3) {
          remaining.push(op);
        }
      }
    }

    storage.set(this.QUEUE_KEY, JSON.stringify(remaining));
    this.isSyncing = false;
  }

  private static async executeOperation(op: QueuedOperation): Promise<void> {
    // Execute based on type - implementation would use Supabase client
    console.log('Executing:', op);
  }
}

