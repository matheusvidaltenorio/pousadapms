import { useEffect, useState } from 'react'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'

interface PaymentItem {
  amount: number
  paymentMethod: string
  paymentDate: string
  booking?: { guest?: { name: string } }
}

interface ExpenseItem {
  category: string
  amount: number
  description?: string
  expenseDate: string
}

interface CashClosure {
  date?: string
  startDate?: string
  endDate?: string
  totalReceipts: number
  totalExpenses: number
  balance: number
  payments: PaymentItem[]
  expenses: ExpenseItem[]
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

type PeriodPreset = 'today' | 'month' | 'year' | 'custom'

function exportToExcel(closure: CashClosure, periodLabel: string) {
  const sep = '\t'
  const lines: string[] = []

  lines.push('FECHAMENTO DE CAIXA')
  lines.push(`Período: ${periodLabel}`)
  lines.push('')
  lines.push(`Total Receitas${sep}R$ ${Number(closure.totalReceipts).toFixed(2)}`)
  lines.push(`Total Despesas${sep}R$ ${Number(closure.totalExpenses).toFixed(2)}`)
  lines.push(`Saldo${sep}R$ ${Number(closure.balance).toFixed(2)}`)
  lines.push('')

  lines.push('RECEITAS (Pagamentos)')
  lines.push(`Data${sep}Valor${sep}Forma${sep}Hóspede`)
  closure.payments.forEach((p) => {
    const date = p.paymentDate ? formatDate(p.paymentDate) : '-'
    lines.push(
      `${date}${sep}R$ ${Number(p.amount).toFixed(2)}${sep}${p.paymentMethod}${sep}${p.booking?.guest?.name ?? '-'}`,
    )
  })
  lines.push('')

  lines.push('DESPESAS')
  lines.push(`Data${sep}Categoria${sep}Descrição${sep}Valor`)
  closure.expenses.forEach((e) => {
    const date = e.expenseDate ? formatDate(e.expenseDate) : '-'
    lines.push(
      `${date}${sep}${e.category}${sep}${e.description ?? '-'}${sep}R$ ${Number(e.amount).toFixed(2)}`,
    )
  })

  const csv = lines.join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `fechamento-${periodLabel.replace(/\s+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function FinancialPage() {
  const propertyId = useProperty()
  const [closure, setClosure] = useState<CashClosure | null>(null)
  const [loading, setLoading] = useState(true)
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('today')
  const [startDate, setStartDate] = useState(toYMD(new Date()))
  const [endDate, setEndDate] = useState(toYMD(new Date()))

  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const firstOfYear = new Date(today.getFullYear(), 0, 1)
  const lastOfYear = new Date(today.getFullYear(), 11, 31)

  const applyPreset = (preset: PeriodPreset) => {
    setPeriodPreset(preset)
    if (preset === 'today') {
      setStartDate(toYMD(today))
      setEndDate(toYMD(today))
    } else if (preset === 'month') {
      setStartDate(toYMD(firstOfMonth))
      setEndDate(toYMD(lastOfMonth))
    } else if (preset === 'year') {
      setStartDate(toYMD(firstOfYear))
      setEndDate(toYMD(lastOfYear))
    }
  }

  useEffect(() => {
    if (!propertyId) return
    setLoading(true)
    const url =
      periodPreset === 'custom' || startDate !== endDate
        ? `/dashboard/cash-closure?propertyId=${propertyId}&startDate=${startDate}&endDate=${endDate}`
        : `/dashboard/cash-closure?propertyId=${propertyId}&date=${startDate}`
    apiFetch<CashClosure>(url)
      .then(setClosure)
      .catch(() => setClosure(null))
      .finally(() => setLoading(false))
  }, [propertyId, startDate, endDate, periodPreset])

  const periodLabel =
    periodPreset === 'today'
      ? formatDate(startDate)
      : periodPreset === 'month'
        ? `${firstOfMonth.toLocaleDateString('pt-BR', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())} ${today.getFullYear()}`
        : periodPreset === 'year'
          ? String(today.getFullYear())
          : `${formatDate(startDate)} a ${formatDate(endDate)}`

  if (!propertyId) return <p className="text-[#6B7280]">Nenhuma propriedade selecionada.</p>

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Fechamento de Caixa</h1>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-[#6B7280]">Período:</span>
          <div className="flex flex-wrap gap-1">
            {(['today', 'month', 'year', 'custom'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  periodPreset === p
                    ? 'bg-[#1E3A5F] text-[#FAFAF8]'
                    : 'bg-[#FAFAF8] text-[#1E3A5F] border border-[#D1D5DB] hover:bg-[#F4F1EC]'
                }`}
              >
                {p === 'today' && 'Hoje'}
                {p === 'month' && 'Este mês'}
                {p === 'year' && 'Este ano'}
                {p === 'custom' && 'Personalizado'}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-default max-w-[140px]"
            />
            <span className="text-[#6B7280]">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-default max-w-[140px]"
            />
          </div>
          {closure && (
            <button
              type="button"
              onClick={() => exportToExcel(closure, periodLabel)}
              className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Exportar Excel
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-[#6B7280]">Carregando...</p>
      ) : closure ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card-base p-6 border-l-4 border-green-500">
              <h3 className="text-sm font-medium text-green-800">Receitas</h3>
              <p className="text-2xl font-bold text-green-700 mt-1">
                R$ {Number(closure.totalReceipts).toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {closure.payments.length} pagamento(s)
              </p>
            </div>
            <div className="card-base p-6 border-l-4 border-red-500">
              <h3 className="text-sm font-medium text-red-800">Despesas</h3>
              <p className="text-2xl font-bold text-red-700 mt-1">
                R$ {Number(closure.totalExpenses).toFixed(2)}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {closure.expenses.length} despesa(s)
              </p>
            </div>
            <div className="card-base p-6 border-l-4 border-[#1E3A5F]">
              <h3 className="text-sm font-medium text-[#1E3A5F]">Saldo do Período</h3>
              <p
                className={`text-2xl font-bold mt-1 ${
                  closure.balance >= 0 ? 'text-[#1E3A5F]' : 'text-red-700'
                }`}
              >
                R$ {Number(closure.balance).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-base p-4">
              <h3 className="font-semibold text-[#1E3A5F] mb-3">
                Pagamentos recebidos ({closure.payments.length})
              </h3>
              {closure.payments.length === 0 ? (
                <p className="text-[#6B7280] text-sm">Nenhum pagamento neste período.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {closure.payments.map((p, i) => (
                    <li key={i} className="flex justify-between text-sm py-1 border-b border-[#D1D5DB]/50 last:border-0">
                      <span>
                        {p.paymentDate ? formatDate(p.paymentDate) : '-'} — R$ {Number(p.amount).toFixed(2)} — {p.paymentMethod}
                        {p.booking?.guest?.name && (
                          <span className="text-[#6B7280] ml-1">({p.booking.guest.name})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card-base p-4">
              <h3 className="font-semibold text-[#1E3A5F] mb-3">
                Despesas ({closure.expenses.length})
              </h3>
              {closure.expenses.length === 0 ? (
                <p className="text-[#6B7280] text-sm">Nenhuma despesa neste período.</p>
              ) : (
                <ul className="space-y-2 max-h-64 overflow-auto">
                  {closure.expenses.map((e, i) => (
                    <li key={i} className="flex justify-between text-sm py-1 border-b border-[#D1D5DB]/50 last:border-0">
                      <span>
                        {e.expenseDate ? formatDate(e.expenseDate) : '-'} — {e.category}
                        {e.description && (
                          <span className="text-[#6B7280] ml-1">({e.description})</span>
                        )}
                      </span>
                      <span className="text-red-600 font-medium">
                        R$ {Number(e.amount).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[#6B7280]">Não foi possível carregar o fechamento.</p>
      )}
    </div>
  )
}
