/**
 * Cliente HTTP para comunicação com a API.
 *
 * Modo online: chama a API normalmente e cacheia respostas GET.
 * Modo offline:
 *   - GET: retorna do cache se disponível, senão erro
 *   - POST/PUT/DELETE: adiciona à fila de sync e lança erro informativo
 */
const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

import { getCached, setCache, addToSyncQueue } from '@/core/offline/db'

export interface ApiError {
  message: string;
  statusCode: number;
}

function isMutation(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  const isOffline = !navigator.onLine

  if (isOffline) {
    if (isMutation(method)) {
      await addToSyncQueue(path, method, options.body as string | undefined)
      throw {
        message: 'Operação salva. Será sincronizada quando estiver online.',
        statusCode: 0,
        queued: true,
      } as ApiError & { queued?: boolean }
    }
    const cached = await getCached<T>(`${method}:${path}`)
    if (cached !== null) return cached
    throw {
      message: 'Você está offline e não há dados em cache para esta consulta.',
      statusCode: 0,
    } as ApiError
  }

  const token = localStorage.getItem('token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw {
      message: (body as { message?: string }).message || res.statusText,
      statusCode: res.status,
    } as ApiError
  }

  const data = await res.json() as T

  if (method === 'GET') {
    await setCache(`${method}:${path}`, data).catch(() => {})
  }

  return data
}
