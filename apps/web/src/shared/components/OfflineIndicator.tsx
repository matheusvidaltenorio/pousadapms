import { useState, useEffect } from 'react'
import { useOnlineStatus } from '@/core/offline/useOnlineStatus'
import { getSyncQueueCount } from '@/core/offline/db'

/**
 * Banner que indica status offline e quantidade de operações pendentes.
 * Exibido no topo da tela quando não há conexão.
 */
export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!isOnline) {
      getSyncQueueCount().then(setPendingCount)
    }
    const interval = setInterval(() => {
      getSyncQueueCount().then(setPendingCount)
    }, 3000)
    return () => clearInterval(interval)
  }, [isOnline])

  if (isOnline) return null

  return (
    <div
      className="bg-amber-600 text-white px-4 py-2 text-center text-sm font-medium"
      role="alert"
    >
      Você está offline. Algumas funções podem estar limitadas.
      {pendingCount > 0 && (
        <span className="ml-2">
          {pendingCount} operação(ões) serão sincronizadas quando a conexão voltar.
        </span>
      )}
    </div>
  )
}
