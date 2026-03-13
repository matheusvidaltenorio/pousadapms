import { useEffect, useRef } from 'react'
import { useOnlineStatus } from './useOnlineStatus'
import { processSyncQueue } from './syncWorker'

/**
 * Componente invisível que dispara a sincronização da fila offline
 * quando a conexão volta. Deve ser montado na raiz do app.
 */
export function SyncEffect() {
  const isOnline = useOnlineStatus()
  const wasOffline = useRef(false)

  useEffect(() => {
    if (isOnline && wasOffline.current) {
      wasOffline.current = false
      processSyncQueue().catch(() => {})
    }
    if (!isOnline) wasOffline.current = true
  }, [isOnline])

  return null
}
