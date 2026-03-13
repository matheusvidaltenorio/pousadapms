import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'
import { useAuth } from '@/core/auth/useAuth'
import { Skeleton, SkeletonCard, SkeletonText } from '@/shared/components/Skeleton'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

interface DashboardStats {
  totalRooms: number
  occupiedToday: number
  occupancyRate: number
  checkinsToday: number
  checkoutsToday: number
  revenueToday?: number
}

interface DashboardOverview {
  todayReservations: { guestName: string; roomNumber: string; type: 'check-in' | 'check-out' }[]
  roomStatus: { available: number; occupied: number; cleaning: number; maintenance: number; blocked?: number }
  alerts: string[]
  occupancyWeek: { day: string; label: string; rate: number }[]
}

const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Bom dia'
  if (h >= 12 && h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(date: Date) {
  return `${DAY_NAMES[date.getDay()]}, ${date.getDate()} de ${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`
}

/**
 * Dashboard - visão operacional da pousada.
 */
export function DashboardPage() {
  const propertyId = useProperty()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [overviewLoading, setOverviewLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    if (!propertyId) return
    apiFetch<DashboardStats>(`/dashboard/stats?propertyId=${propertyId}`)
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [propertyId])

  useEffect(() => {
    if (!propertyId) return
    apiFetch<DashboardOverview>(`/dashboard/overview?propertyId=${propertyId}`)
      .then(setOverview)
      .catch(() => setOverview(null))
      .finally(() => setOverviewLoading(false))
  }, [propertyId])

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!propertyId) return <p className="text-[#6B7280]">Nenhuma propriedade selecionada.</p>

  const userName = user?.name?.split(' ')[0] || 'Administrador'
  const occupancyChartData = overview?.occupancyWeek
    ? {
        labels: overview.occupancyWeek.map((d) => d.label),
        datasets: [
          {
            label: 'Ocupação (%)',
            data: overview.occupancyWeek.map((d) => d.rate),
            backgroundColor: 'rgba(30, 58, 95, 0.7)',
            borderRadius: 6,
          },
        ],
      }
    : null

  return (
    <div className="space-y-6">
      {/* Topo: Saudação + Data + Hora */}
      <div className="card-base p-6">
        <h2 className="text-xl font-bold text-[#1E3A5F]">
          {getGreeting()}, {userName}
        </h2>
        <p className="text-[#6B7280] mt-1">{formatDate(currentTime)}</p>
        <p className="text-sm text-[#6B7280] mt-1">Hora atual: {formatTime(currentTime)}</p>
      </div>

      {/* Cards existentes */}
      <h1 className="text-2xl font-bold text-[#1E3A5F]">Dashboard</h1>
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
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

          {/* Botões de ação rápida */}
          <div className="flex gap-4">
            <Link to="/calendar" className="btn-primary">
              Ver Calendário
            </Link>
            <Link to="/bookings/new" className="btn-secondary">
              Nova Reserva
            </Link>
          </div>

          {/* Reservas de Hoje */}
          <section className="card-base p-6">
            <h3 className="text-lg font-semibold text-[#1E3A5F] mb-4">Reservas de Hoje</h3>
            {overviewLoading ? (
              <SkeletonText lines={4} />
            ) : overview?.todayReservations && overview.todayReservations.length > 0 ? (
              <ul className="space-y-2">
                {overview.todayReservations.map((r, i) => (
                  <li key={i} className="text-[#1E3A5F] flex items-center gap-2">
                    <span className="font-medium">{r.guestName}</span>
                    <span className="text-[#6B7280]">—</span>
                    <span>Quarto {r.roomNumber}</span>
                    <span className="text-[#6B7280]">—</span>
                    <span
                      className={`text-sm font-medium px-2 py-0.5 rounded ${
                        r.type === 'check-in' ? 'bg-[#E8F4EA] text-[#2E7D32]' : 'bg-[#FFF3E0] text-[#E65100]'
                      }`}
                    >
                      {r.type === 'check-in' ? 'Check-in' : 'Check-out'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#6B7280] text-sm">Nenhuma reserva com check-in ou check-out hoje.</p>
            )}
          </section>

          {/* Status dos Quartos */}
          <section className="card-base p-6">
            <h3 className="text-lg font-semibold text-[#1E3A5F] mb-4">Status dos Quartos</h3>
            {overviewLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : overview?.roomStatus ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="p-3 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9]">
                  <span className="text-sm text-[#6B7280] block">Disponíveis</span>
                  <span className="text-2xl font-bold text-[#1E3A5F]">{overview.roomStatus.available}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#FFEBEE] border border-[#FFCDD2]">
                  <span className="text-sm text-[#6B7280] block">Ocupados</span>
                  <span className="text-2xl font-bold text-[#1E3A5F]">{overview.roomStatus.occupied}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#FFF8E1] border border-[#FFECB3]">
                  <span className="text-sm text-[#6B7280] block">Em Limpeza</span>
                  <span className="text-2xl font-bold text-[#1E3A5F]">{overview.roomStatus.cleaning}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#FBE9E7] border border-[#FFCCBC]">
                  <span className="text-sm text-[#6B7280] block">Manutenção</span>
                  <span className="text-2xl font-bold text-[#1E3A5F]">{overview.roomStatus.maintenance}</span>
                </div>
                <div className="p-3 rounded-lg bg-[#ECEFF1] border border-[#CFD8DC]">
                  <span className="text-sm text-[#6B7280] block">Bloqueados</span>
                  <span className="text-2xl font-bold text-[#1E3A5F]">{(overview.roomStatus as { blocked?: number }).blocked ?? 0}</span>
                </div>
              </div>
            ) : (
              <p className="text-[#6B7280] text-sm">Não foi possível carregar o status.</p>
            )}
          </section>

          {/* Avisos */}
          <section className="card-base p-6">
            <h3 className="text-lg font-semibold text-[#1E3A5F] mb-4">Avisos</h3>
            {overviewLoading ? (
              <SkeletonText lines={3} />
            ) : overview?.alerts && overview.alerts.length > 0 ? (
              <ul className="space-y-2">
                {overview.alerts.map((msg, i) => (
                  <li key={i} className="text-[#1E3A5F] flex items-start gap-2">
                    <span className="text-[#4A6FA5]">•</span>
                    <span>{msg}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[#6B7280] text-sm">Nenhum aviso no momento.</p>
            )}
          </section>

          {/* Gráfico de Ocupação */}
          <section className="card-base p-6">
            <h3 className="text-lg font-semibold text-[#1E3A5F] mb-4">Ocupação últimos 7 dias</h3>
            {overviewLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : occupancyChartData ? (
              <div className="h-64">
                <Bar
                  data={occupancyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => ` ${ctx.raw}% de ocupação`,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: (v) => `${v}%`,
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <p className="text-[#6B7280] text-sm">Sem dados de ocupação disponíveis.</p>
            )}
          </section>
        </>
      )}
    </div>
  )
}
