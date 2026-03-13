import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'
import { Skeleton } from '@/shared/components/Skeleton'

function BookingsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className=" rounded-lg overflow-hidden border border-[#D1D5DB]">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  checked_in: 'Em estadia',
  checked_out: 'Finalizada',
  cancelled: 'Cancelada',
  no_show: 'No-show',
}

interface Booking {
  id: string
  checkinDate: string
  checkoutDate: string
  status: string
  totalAmount: number
  guest: { name: string }
  room: { number: string; roomType: { name: string } }
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function BookingsPage() {
  const propertyId = useProperty()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!propertyId) return
    apiFetch<Booking[]>(`/bookings?propertyId=${propertyId}`)
      .then(setBookings)
      .catch((e) => setError(e.message || 'Erro ao carregar reservas'))
      .finally(() => setLoading(false))
  }, [propertyId])

  if (!propertyId) return <p className="text-gray-500">Nenhuma propriedade selecionada.</p>
  if (loading) return <BookingsSkeleton />
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Reservas</h1>
        <Link
          to="/bookings/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Nova Reserva
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hóspede</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quarto</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check-in</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Check-out</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/bookings/${b.id}`} className="text-blue-600 hover:underline">
                    {b.guest?.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{b.room?.number} ({b.room?.roomType?.name})</td>
                <td className="px-4 py-3">{formatDate(b.checkinDate)}</td>
                <td className="px-4 py-3">{formatDate(b.checkoutDate)}</td>
                <td className="px-4 py-3">{STATUS_LABELS[b.status] ?? b.status}</td>
                <td className="px-4 py-3">R$ {Number(b.totalAmount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {bookings.length === 0 && (
        <p className="text-gray-500 mt-4">Nenhuma reserva cadastrada.</p>
      )}
    </div>
  )
}
