/**
 * Processa a fila de sincronização quando a conexão volta.
 * Chama cada operação pendente na API e atualiza o status.
 */
import { getPendingSyncItems, markSyncItemSynced, markSyncItemFailed } from './db'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

async function executeSyncItem(item: { id?: number; path: string; method: string; body?: string }) {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  const res = await fetch(`${API_BASE}${item.path}`, {
    method: item.method,
    headers,
    body: item.body,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { message?: string }).message || res.statusText)
  }

  return res.json()
}

export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  const items = await getPendingSyncItems()
  let synced = 0
  let failed = 0

  for (const item of items) {
    if (!item.id) continue
    try {
      await executeSyncItem(item)
      await markSyncItemSynced(item.id)
      synced++
    } catch (err) {
      await markSyncItemFailed(item.id, String(err))
      failed++
    }
  }

  return { synced, failed }
}
