import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'

interface Booking {
  id: string
  checkinDate: string
  checkoutDate: string
  status: string
  guest: { name: string }
  room: { number: string }
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  checked_in: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200',
  checked_out: 'bg-gray-100 text-gray-600 border-gray-200',
}

function dateToYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

function isBetween(date: Date, start: Date, end: Date) {
  const d = date.getTime()
  const s = start.getTime()
  const e = end.getTime()
  return d >= s && d < e
}

export function CalendarPage() {
  const propertyId = useProperty()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const startOfMonth = new Date(current.year, current.month, 1)
  const endOfMonth = new Date(current.year, current.month + 1, 0)
  const startForQuery = new Date(current.year, current.month - 1, 1) // buscar um pouco antes
  const endForQuery = new Date(current.year, current.month + 2, 0) // e depois

  useEffect(() => {
    if (!propertyId) return
    apiFetch<Booking[]>(
      `/bookings?propertyId=${propertyId}&startDate=${dateToYMD(startForQuery)}&endDate=${dateToYMD(endForQuery)}`,
    )
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [propertyId, current.year, current.month])

  const prevMonth = () => {
    setCurrent((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))
  }
  const nextMonth = () => {
    setCurrent((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))
  }

  const monthName = new Date(current.year, current.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const firstDay = startOfMonth.getDay()
  const daysInMonth = endOfMonth.getDate()
  const emptySlots = firstDay === 0 ? 6 : firstDay - 1

  const bookingsForDay = (day: number) => {
    const d = new Date(current.year, current.month, day)
    return bookings.filter((b) => {
      if (b.status === 'cancelled') return false
      const start = new Date(b.checkinDate)
      const end = new Date(b.checkoutDate)
      end.setDate(end.getDate() + 1)
      return isBetween(d, start, end)
    })
  }

  if (!propertyId) return <p className="text-gray-500">Nenhuma propriedade selecionada.</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold capitalize">Calendário — {monthName}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <button
            type="button"
            onClick={() => setCurrent({ year: new Date().getFullYear(), month: new Date().getMonth() })}
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Próximo →
          </button>
          <Link
            to="/bookings/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Nova Reserva
          </Link>
        </div>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
              <div key={d} className="p-2 text-center text-sm font-medium text-gray-600">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: emptySlots }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-r border-b border-gray-100 bg-gray-50/50" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const dayBookings = bookingsForDay(day)
              const isToday =
                current.year === new Date().getFullYear() &&
                current.month === new Date().getMonth() &&
                day === new Date().getDate()

              return (
                <div
                  key={day}
                  className={`min-h-[100px] border-r border-b border-gray-100 p-1 ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <span className={`text-sm font-medium ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>{day}</span>
                  <div className="mt-1 space-y-0.5 overflow-hidden">
                    {dayBookings.slice(0, 3).map((b) => (
                      <Link
                        key={b.id}
                        to={`/bookings/${b.id}`}
                        className={`block truncate text-xs px-1 py-0.5 rounded border ${STATUS_COLORS[b.status] ?? 'bg-gray-100'}`}
                      >
                        {b.room?.number} - {b.guest?.name}
                      </Link>
                    ))}
                    {dayBookings.length > 3 && (
                      <span className="text-xs text-gray-500">+{dayBookings.length - 3} mais</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
