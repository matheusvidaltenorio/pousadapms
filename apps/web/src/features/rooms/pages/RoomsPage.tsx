import { useEffect, useState } from 'react'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  occupied: 'bg-red-100 text-red-800',
  cleaning: 'bg-amber-100 text-amber-800',
  maintenance: 'bg-gray-100 text-gray-800',
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Livre',
  occupied: 'Ocupado',
  cleaning: 'Limpeza',
  maintenance: 'Manutenção',
}

interface Room {
  id: string
  number: string
  floor: number
  status: string
  roomType: { name: string; basePrice: string | number }
}

export function RoomsPage() {
  const propertyId = useProperty()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!propertyId) return
    apiFetch<Room[]>(`/rooms?propertyId=${propertyId}`)
      .then(setRooms)
      .catch((e) => setError(e.message || 'Erro ao carregar quartos'))
      .finally(() => setLoading(false))
  }, [propertyId])

  if (!propertyId) return <p className="text-gray-500">Nenhuma propriedade selecionada.</p>
  if (loading) return <p>Carregando quartos...</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Quartos</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:border-gray-200 transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">Quarto {room.number}</h3>
                <p className="text-sm text-gray-500">{room.roomType?.name}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  STATUS_COLORS[room.status] ?? 'bg-gray-100 text-gray-800'
                }`}
              >
                {STATUS_LABELS[room.status] ?? room.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
