import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'

interface Room {
  id: string
  number: string
  roomType: { name: string; basePrice: string | number }
}

interface Guest {
  id: string
  name: string
}

export function NewBookingPage() {
  const propertyId = useProperty()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [checkinDate, setCheckinDate] = useState('')
  const [checkoutDate, setCheckoutDate] = useState('')
  const [roomId, setRoomId] = useState('')
  const [guestId, setGuestId] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!propertyId) return
    apiFetch<Guest[]>(`/guests?propertyId=${propertyId}`).then(setGuests).catch(() => setGuests([]))
  }, [propertyId])

  useEffect(() => {
    if (!propertyId || !checkinDate || !checkoutDate) return
    if (new Date(checkoutDate) <= new Date(checkinDate)) return
    apiFetch<Room[]>(
      `/bookings/available-rooms?propertyId=${propertyId}&checkinDate=${checkinDate}&checkoutDate=${checkoutDate}`,
    )
      .then(setRooms)
      .catch(() => setRooms([]))
  }, [propertyId, checkinDate, checkoutDate])

  // Cálculo automático: noites × diária do quarto
  useEffect(() => {
    if (!checkinDate || !checkoutDate || !roomId) return
    const checkin = new Date(checkinDate)
    const checkout = new Date(checkoutDate)
    if (checkout <= checkin) return
    const nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))
    const room = rooms.find((r) => r.id === roomId)
    const basePrice = Number(room?.roomType?.basePrice ?? 0)
    if (nights > 0 && basePrice > 0) {
      setTotalAmount((nights * basePrice).toFixed(2))
    }
  }, [checkinDate, checkoutDate, roomId, rooms])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId || !roomId || !guestId) return
    setError('')
    setLoading(true)
    try {
      const booking = await apiFetch<{ id: string }>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          roomId,
          guestId,
          checkinDate,
          checkoutDate,
          totalAmount: parseFloat(totalAmount) || 0,
          notes: notes || undefined,
        }),
      })
      navigate(`/bookings/${booking.id}`)
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Erro ao criar reserva')
    } finally {
      setLoading(false)
    }
  }

  if (!propertyId) return <p className="text-gray-500">Nenhuma propriedade selecionada.</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nova Reserva</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
            <input
              type="date"
              value={checkinDate}
              onChange={(e) => setCheckinDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
            <input
              type="date"
              value={checkoutDate}
              onChange={(e) => setCheckoutDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quarto disponível</label>
          <select
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            <option value="">Selecione o quarto</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.number} - {r.roomType?.name} (R$ {Number(r.roomType?.basePrice || 0).toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hóspede</label>
          <select
            value={guestId}
            onChange={(e) => setGuestId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          >
            <option value="">Selecione o hóspede</option>
            {guests.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valor total (R$)</label>
          <input
            type="number"
            step="0.01"
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Calculado automaticamente (noites × diária). Pode editar para descontos ou valores especiais.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            rows={2}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Criar Reserva'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
