import { useEffect, useState } from 'react'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'

interface Room {
  id: string
  number: string
  roomType: { name: string }
}

interface SyncLog {
  id: string
  startedAt: string
  finishedAt?: string
  status: string
  bookingsCreated: number
  bookingsUpdated: number
  bookingsCancelled: number
  errorMessage?: string
}

interface Integration {
  id: string
  channel: string
  icalUrl: string
  roomId: string
  isActive: boolean
  lastSyncAt?: string
  lastSyncStatus?: string
  lastSyncError?: string
  room: Room
  syncLogs: SyncLog[]
}

function formatDate(s?: string) {
  if (!s) return '-'
  return new Date(s).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CHANNELS = [
  { value: 'booking', label: 'Booking.com' },
  { value: 'airbnb', label: 'Airbnb' },
] as const

export function IntegrationsPage() {
  const propertyId = useProperty()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [channel, setChannel] = useState<string>('booking')
  const [icalUrl, setIcalUrl] = useState('')
  const [roomId, setRoomId] = useState('')
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)

  const load = () => {
    if (!propertyId) return
    Promise.all([
      apiFetch<Integration[]>(`/integrations?propertyId=${propertyId}`),
      apiFetch<Room[]>(`/rooms?propertyId=${propertyId}`),
    ])
      .then(([ints, rms]) => {
        setIntegrations(ints)
        setRooms(rms)
        if (rms.length > 0 && !roomId) setRoomId(rms[0].id)
      })
      .catch(() => setIntegrations([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!propertyId) return
    setLoading(true)
    load()
  }, [propertyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId || !icalUrl.trim() || !roomId) return
    setSaving(true)
    try {
      await apiFetch('/integrations', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          channel,
          icalUrl: icalUrl.trim(),
          roomId,
        }),
      })
      setIcalUrl('')
      setRoomId(rooms[0]?.id ?? '')
      setShowForm(false)
      load()
    } catch (err: unknown) {
      alert((err as { message?: string }).message || 'Erro ao cadastrar integração')
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async (id: string) => {
    setSyncing(id)
    try {
      await apiFetch(`/integrations/${id}/sync`, { method: 'POST' })
      load()
    } catch (err: unknown) {
      alert((err as { message?: string }).message || 'Erro ao sincronizar')
    } finally {
      setSyncing(null)
    }
  }

  const handleSyncAll = async () => {
    if (!propertyId) return
    setSyncing('all')
    try {
      await apiFetch('/integrations/sync-all', {
        method: 'POST',
        body: JSON.stringify({ propertyId }),
      })
      load()
    } catch (err: unknown) {
      alert((err as { message?: string }).message || 'Erro ao sincronizar')
    } finally {
      setSyncing(null)
    }
  }

  const handleToggleActive = async (int: Integration) => {
    try {
      await apiFetch(`/integrations/${int.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !int.isActive }),
      })
      load()
    } catch (err: unknown) {
      alert((err as { message?: string }).message || 'Erro ao atualizar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta integração?')) return
    try {
      await apiFetch(`/integrations/${id}`, { method: 'DELETE' })
      load()
    } catch (err: unknown) {
      alert((err as { message?: string }).message || 'Erro ao excluir')
    }
  }

  if (!propertyId) return <p className="text-gray-500">Nenhuma propriedade selecionada.</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Integrações OTA (iCal)</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSyncAll}
            disabled={!integrations.filter(i => i.isActive).length || syncing !== null}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
          >
            {syncing === 'all' ? 'Sincronizando...' : 'Sincronizar todas'}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : 'Nova integração'}
          </button>
        </div>
      </div>

      <p className="text-gray-600 mb-6">
        Conecte os calendários do Booking.com e Airbnb via URL iCal para importar reservas automaticamente.
        Cada URL de calendário representa um quarto específico.
      </p>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Canal</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL iCal *</label>
            <input
              type="url"
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md font-mono text-sm"
              placeholder="https://..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quarto *</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Selecione</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number} - {r.roomType.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-md">
            {saving ? 'Salvando...' : 'Cadastrar'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="space-y-4">
          {integrations.map((int) => (
            <div key={int.id} className="bg-white rounded-lg shadow p-4 border">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {CHANNELS.find(c => c.value === int.channel)?.label ?? int.channel}
                    </span>
                    <span className="text-gray-500">→ Quarto {int.room.number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${int.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200'}`}>
                      {int.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 break-all font-mono">{int.icalUrl}</p>
                  {int.lastSyncAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Última sync: {formatDate(int.lastSyncAt)} - {int.lastSyncStatus ?? '-'}
                      {int.lastSyncError && <span className="text-red-600"> ({int.lastSyncError})</span>}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSync(int.id)}
                    disabled={!int.isActive || syncing !== null}
                    className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                  >
                    {syncing === int.id ? '...' : 'Sync'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(int)}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  >
                    {int.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(int.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Excluir
                  </button>
                </div>
              </div>
              {int.syncLogs?.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-gray-500 mb-1">Últimas sincronizações</p>
                  <ul className="text-xs space-y-1">
                    {int.syncLogs.map((log) => (
                      <li key={log.id}>
                        {formatDate(log.startedAt)} | {log.status} | +{log.bookingsCreated} -{log.bookingsCancelled}
                        {log.errorMessage && ` | ${log.errorMessage}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && integrations.length === 0 && (
        <p className="text-gray-500 mt-4">
          Nenhuma integração configurada. Adicione a URL iCal do Booking ou Airbnb para importar reservas.
        </p>
      )}
    </div>
  )
}
