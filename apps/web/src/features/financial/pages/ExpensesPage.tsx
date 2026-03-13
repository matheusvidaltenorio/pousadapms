import { useEffect, useState } from 'react'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'

interface Expense {
  id: string
  category: string
  description?: string
  amount: number
  expenseDate: string
  paymentMethod?: string
}

const CATEGORIES = ['Alimentação', 'Manutenção', 'Energia', 'Água', 'Internet', 'Funcionários', 'Outros']

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function ExpensesPage() {
  const propertyId = useProperty()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('')
  const [saving, setSaving] = useState(false)

  const loadExpenses = () => {
    if (!propertyId) return
    apiFetch<Expense[]>(`/expenses?propertyId=${propertyId}`)
      .then(setExpenses)
      .catch(() => setExpenses([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!propertyId) return
    setLoading(true)
    loadExpenses()
  }, [propertyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId || !category.trim() || !amount || parseFloat(amount) <= 0) return
    setSaving(true)
    try {
      await apiFetch('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          category: category.trim(),
          description: description.trim() || undefined,
          amount: parseFloat(amount),
          expenseDate,
          paymentMethod: paymentMethod.trim() || undefined,
        }),
      })
      setCategory('')
      setDescription('')
      setAmount('')
      setExpenseDate(new Date().toISOString().slice(0, 10))
      setPaymentMethod('')
      setShowForm(false)
      loadExpenses()
    } catch (err: unknown) {
      alert((err as { message?: string }).message || 'Erro ao cadastrar despesa')
    } finally {
      setSaving(false)
    }
  }

  if (!propertyId) return <p className="text-gray-500">Nenhuma propriedade selecionada.</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Despesas</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : 'Nova Despesa'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Selecione</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Descrição da despesa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
            <input
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forma de pagamento</label>
            <input
              type="text"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="PIX, dinheiro, cartão..."
            />
          </div>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-md">
            {saving ? 'Salvando...' : 'Cadastrar'}
          </button>
        </form>
      )}

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{formatDate(e.expenseDate)}</td>
                  <td className="px-4 py-3 font-medium">{e.category}</td>
                  <td className="px-4 py-3 text-gray-600">{e.description ?? '-'}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">
                    R$ {Number(e.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!loading && expenses.length === 0 && (
        <p className="text-gray-500 mt-4">Nenhuma despesa cadastrada.</p>
      )}
    </div>
  )
}
