import Dexie, { type Table } from 'dexie'

/**
 * Entrada no cache de respostas da API.
 * Usada para servir dados offline em requisições GET.
 */
export interface CacheEntry {
  key: string
  data: unknown
  timestamp: number
}

/**
 * Operação pendente para sincronizar quando voltar online.
 */
export interface SyncItem {
  id?: number
  path: string
  method: string
  body?: string
  timestamp: number
  status: 'pending' | 'synced' | 'failed'
  error?: string
}

/**
 * Banco IndexedDB para cache e fila de sincronização offline.
 * Dexie simplifica o uso de IndexedDB no navegador.
 */
export class OfflineDB extends Dexie {
  cache!: Table<CacheEntry, string>
  syncQueue!: Table<SyncItem, number>

  constructor() {
    super('PousadaPMSOffline')
    this.version(1).stores({
      cache: 'key',
      syncQueue: '++id, status, timestamp',
    })
  }
}

export const db = new OfflineDB()

/** TTL do cache em ms (1 hora) */
const CACHE_TTL = 60 * 60 * 1000

export async function getCached<T>(key: string): Promise<T | null> {
  const entry = await db.cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    await db.cache.delete(key)
    return null
  }
  return entry.data as T
}

export async function setCache(key: string, data: unknown): Promise<void> {
  await db.cache.put({
    key,
    data,
    timestamp: Date.now(),
  })
}

export async function addToSyncQueue(path: string, method: string, body?: string): Promise<number> {
  return db.syncQueue.add({
    path,
    method,
    body,
    timestamp: Date.now(),
    status: 'pending',
  })
}

export async function getPendingSyncItems(): Promise<SyncItem[]> {
  return db.syncQueue.where('status').equals('pending').sortBy('timestamp')
}

export async function markSyncItemSynced(id: number): Promise<void> {
  await db.syncQueue.update(id, { status: 'synced' })
}

export async function markSyncItemFailed(id: number, error: string): Promise<void> {
  await db.syncQueue.update(id, { status: 'failed', error })
}

export async function getSyncQueueCount(): Promise<number> {
  return db.syncQueue.where('status').equals('pending').count()
}
