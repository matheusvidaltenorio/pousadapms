import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  checked_in: 'Em estadia',
  checked_out: 'Finalizada',
  cancelled: 'Cancelada',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  cash: 'Dinheiro',
  transfer: 'Transferência',
  other: 'Outro',
}

interface Payment {
  id: string
  amount: number
  paymentMethod: string
  paymentDate: string
}

interface Booking {
  id: string
  propertyId: string
  checkinDate: string
  checkoutDate: string
  status: string
  totalAmount: number
  paidAmount: number
  guest: { name: string; email?: string; phone?: string }
  room: { number: string; roomType: { name: string } }
  payments?: Payment[]
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    apiFetch<Booking>(`/bookings/${id}`)
      .then(setBooking)
      .catch(() => setBooking(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleCheckIn = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await apiFetch(`/bookings/${id}/check-in`, { method: 'POST' })
      setBooking((b) => (b ? { ...b, status: 'checked_in' } : null))
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await apiFetch(`/bookings/${id}/check-out`, { method: 'POST' })
      setBooking((b) => (b ? { ...b, status: 'checked_out' } : null))
    } finally {
      setActionLoading(false)
    }
  }

  const refreshBooking = () => {
    if (!id) return
    apiFetch<Booking>(`/bookings/${id}`).then(setBooking)
  }

  if (loading) return <p>Carregando...</p>
  if (!booking) return <p className="text-red-600">Reserva não encontrada.</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reserva #{booking.id.slice(0, 8)}</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Hóspede</dt>
            <dd className="font-medium">{booking.guest?.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Quarto</dt>
            <dd>{booking.room?.number} - {booking.room?.roomType?.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Check-in</dt>
            <dd>{formatDate(booking.checkinDate)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Check-out</dt>
            <dd>{formatDate(booking.checkoutDate)}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Status</dt>
            <dd>{STATUS_LABELS[booking.status] ?? booking.status}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Valor</dt>
            <dd>R$ {Number(booking.totalAmount).toFixed(2)} (pago: R$ {Number(booking.paidAmount).toFixed(2)})</dd>
          </div>
        </dl>
      </div>

      {booking.status !== 'cancelled' && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold mb-4">Pagamentos</h3>
          <div className="space-y-3 mb-4">
            {(booking.payments ?? []).map((p) => (
              <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm">
                  R$ {Number(p.amount).toFixed(2)} - {PAYMENT_METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod} ({formatDate(p.paymentDate)})
                </span>
              </div>
            ))}
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const amount = parseFloat((form.amount as HTMLInputElement).value)
              const paymentMethod = (form.paymentMethod as HTMLSelectElement).value
              const paymentDate = (form.paymentDate as HTMLInputElement).value
              if (!booking?.propertyId || amount <= 0) return
              setActionLoading(true)
              try {
                await apiFetch('/payments', {
                  method: 'POST',
                  body: JSON.stringify({
                    propertyId: booking.propertyId,
                    bookingId: booking.id,
                    amount,
                    paymentMethod,
                    paymentDate,
                  }),
                })
                refreshBooking()
                form.reset()
              } catch (err: unknown) {
                alert((err as { message?: string }).message || 'Erro ao registrar pagamento')
              } finally {
                setActionLoading(false)
              }
            }}
            className="flex flex-wrap gap-3 items-end"
          >
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valor (R$)</label>
              <input type="number" name="amount" step="0.01" min="0.01" required className="px-3 py-2 border rounded-md w-28" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Forma</label>
              <select name="paymentMethod" required className="px-3 py-2 border rounded-md">
                <option value="pix">PIX</option>
                <option value="cash">Dinheiro</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="debit_card">Cartão de Débito</option>
                <option value="transfer">Transferência</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data</label>
              <input type="date" name="paymentDate" defaultValue={new Date().toISOString().slice(0, 10)} required className="px-3 py-2 border rounded-md" />
            </div>
            <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
              {actionLoading ? 'Salvando...' : 'Registrar Pagamento'}
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-2">
        {booking.status === 'confirmed' && (
          <button
            onClick={handleCheckIn}
            disabled={actionLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Check-in
          </button>
        )}
        {booking.status === 'checked_in' && (
          <button
            onClick={handleCheckOut}
            disabled={actionLoading}
            className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
          >
            Check-out
          </button>
        )}
        <button
          onClick={() => navigate('/bookings')}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}
