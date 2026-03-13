import { useEffect, useState } from 'react'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'
import { CityAutocomplete } from '@/shared/components/CityAutocomplete'
import { Skeleton } from '@/shared/components/Skeleton'

function GuestsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="card-base overflow-hidden">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

interface Guest {
  id: string
  name: string
  email?: string
  phone?: string
  documentNumber?: string
  addressCity?: string
  addressState?: string
}

export function GuestsPage() {
  const propertyId = useProperty()
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCity, setNewCity] = useState({ city: '', state: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!propertyId) return
    apiFetch<Guest[]>(`/guests?propertyId=${propertyId}`)
      .then(setGuests)
      .catch((e) => setError(e.message || 'Erro ao carregar hóspedes'))
      .finally(() => setLoading(false))
  }, [propertyId])

  if (!propertyId) return <p className="text-gray-500">Nenhuma propriedade selecionada.</p>
  if (loading) return <GuestsSkeleton />
  if (error) return <p className="text-red-600">{error}</p>

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId || !newName.trim()) return
    setCreating(true)
    try {
      await apiFetch('/guests', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          name: newName.trim(),
          email: newEmail.trim() || undefined,
          phone: newPhone.trim() || undefined,
          addressCity: newCity.city || undefined,
          addressState: newCity.state || undefined,
        }),
      })
      const list = await apiFetch<Guest[]>(`/guests?propertyId=${propertyId}`)
      setGuests(list)
      setNewName('')
      setNewEmail('')
      setNewPhone('')
      setNewCity({ city: '', state: '' })
      setShowForm(false)
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Erro ao cadastrar')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hóspedes</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : 'Novo Hóspede'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateGuest} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3 max-w-md">
          <input
            type="text"
            placeholder="Nome *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
          <input
            type="email"
            placeholder="E-mail"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <input
            type="tel"
            placeholder="Telefone"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
          <div>
            <label className="block text-xs text-gray-600 mb-1">Cidade</label>
            <CityAutocomplete
              value={newCity}
              onChange={setNewCity}
              placeholder="Digite a cidade..."
              className="w-full"
            />
          </div>
          <button type="submit" disabled={creating} className="px-4 py-2 bg-green-600 text-white rounded-md">
            {creating ? 'Salvando...' : 'Cadastrar'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {guests.map((g) => (
              <tr key={g.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{g.name}</td>
                <td className="px-4 py-3 text-gray-600">{g.email ?? '-'}</td>
                <td className="px-4 py-3 text-gray-600">{g.phone ?? '-'}</td>
                <td className="px-4 py-3 text-gray-600">
                  {g.addressCity ? `${g.addressCity}${g.addressState ? ` - ${g.addressState}` : ''}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {guests.length === 0 && <p className="text-gray-500 mt-4">Nenhum hóspede cadastrado.</p>}
    </div>
  )
}
