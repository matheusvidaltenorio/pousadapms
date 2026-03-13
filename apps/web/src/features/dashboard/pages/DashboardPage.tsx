import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'

interface DashboardStats {
  totalRooms: number
  occupiedToday: number
  occupancyRate: number
  checkinsToday: number
  checkoutsToday: number
  revenueToday?: number
}

/**
 * Dashboard - cards com métricas usando design system.
 */
export function DashboardPage() {
  const propertyId = useProperty()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!propertyId) return
    apiFetch<DashboardStats>(`/dashboard/stats?propertyId=${propertyId}`)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [propertyId])

  if (!propertyId) return <p className="text-[#6B7280]">Nenhuma propriedade selecionada.</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A5F] mb-6">Dashboard</h1>
      {loading ? (
        <p className="text-[#6B7280]">Carregando...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-base p-6 hover:shadow-cardHover transition-shadow">
              <h3 className="text-sm font-medium text-[#6B7280]">Ocupação Hoje</h3>
              <p className="text-3xl font-bold text-[#1E3A5F] mt-1">
                {stats ? `${stats.occupiedToday}/${stats.totalRooms}` : '-'}
              </p>
              <p className="text-sm text-[#6B7280] mt-1">
                {stats ? `${stats.occupancyRate}%` : ''} de taxa de ocupação
              </p>
            </div>
            <div className="card-base p-6 hover:shadow-cardHover transition-shadow">
              <h3 className="text-sm font-medium text-[#6B7280]">Check-ins Hoje</h3>
              <p className="text-3xl font-bold text-[#1E3A5F] mt-1">{stats?.checkinsToday ?? '-'}</p>
              <p className="text-sm text-[#6B7280] mt-1">reservas aguardando entrada</p>
            </div>
            <div className="card-base p-6 hover:shadow-cardHover transition-shadow">
              <h3 className="text-sm font-medium text-[#6B7280]">Check-outs Hoje</h3>
              <p className="text-3xl font-bold text-[#1E3A5F] mt-1">{stats?.checkoutsToday ?? '-'}</p>
              <p className="text-sm text-[#6B7280] mt-1">estadias encerrando hoje</p>
            </div>
            <div className="card-base p-6 hover:shadow-cardHover transition-shadow">
              <h3 className="text-sm font-medium text-[#6B7280]">Receita Hoje</h3>
              <p className="text-3xl font-bold text-[#1E3A5F] mt-1">
                {stats?.revenueToday != null ? `R$ ${Number(stats.revenueToday).toFixed(2)}` : '-'}
              </p>
              <p className="text-sm text-[#6B7280] mt-1">pagamentos recebidos hoje</p>
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <Link to="/calendar" className="btn-primary">
              Ver Calendário
            </Link>
            <Link to="/bookings/new" className="btn-secondary">
              Nova Reserva
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
