import { useEffect, useState } from 'react'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'
import { Skeleton } from '@/shared/components/Skeleton'

function RoomsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="card-base overflow-hidden">
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponível', color: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'occupied', label: 'Ocupado', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'cleaning', label: 'Em Limpeza', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'maintenance', label: 'Manutenção', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'blocked', label: 'Bloqueado', color: 'bg-gray-100 text-gray-800 border-gray-200' },
] as const

const STATUS_MAP = Object.fromEntries(STATUS_OPTIONS.map((s) => [s.value, s]))

interface RoomType {
  id: string
  name: string
  maxGuests: number
  basePrice: string | number
}

interface Room {
  id: string
  number: string
  floor: number
  status: string
  notes?: string | null
  roomType: RoomType
}

/**
 * Formato do preço para exibição.
 */
function formatPrice(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val
  return isNaN(n) ? '-' : `R$ ${n.toFixed(2).replace('.', ',')}`
}

export function RoomsPage() {
  const propertyId = useProperty()
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState<'add' | 'edit' | null>(null)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [saving, setSaving] = useState(false)

  // Formulário: criar quarto
  const [formNumber, setFormNumber] = useState('')
  const [formRoomTypeId, setFormRoomTypeId] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formFloor, setFormFloor] = useState(1)

  // Criar novo tipo
  const [createNewType, setCreateNewType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeMaxGuests, setNewTypeMaxGuests] = useState(2)
  const [newTypeBasePrice, setNewTypeBasePrice] = useState('')

  const loadData = () => {
    if (!propertyId) return
    Promise.all([
      apiFetch<Room[]>(`/rooms?propertyId=${propertyId}`),
      apiFetch<RoomType[]>(`/rooms/types?propertyId=${propertyId}`),
    ])
      .then(([r, t]) => {
        setRooms(r)
        setRoomTypes(t)
        if (t.length > 0 && !formRoomTypeId) setFormRoomTypeId(t[0].id)
      })
      .catch((e) => setError(e.message || 'Erro ao carregar quartos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setLoading(true)
    loadData()
  }, [propertyId])

  const resetForm = () => {
    setFormNumber('')
    setFormRoomTypeId(roomTypes[0]?.id ?? '')
    setFormNotes('')
    setFormFloor(1)
    setCreateNewType(false)
    setNewTypeName('')
    setNewTypeMaxGuests(2)
    setNewTypeBasePrice('')
    setEditRoom(null)
  }

  const openAddModal = () => {
    resetForm()
    setFormRoomTypeId(roomTypes[0]?.id ?? '')
    setModalOpen('add')
  }

  const openEditModal = (room: Room) => {
    setEditRoom(room)
    setFormNumber(room.number)
    setFormRoomTypeId(room.roomType.id)
    setFormNotes(room.notes ?? '')
    setFormFloor(room.floor)
    setModalOpen('edit')
  }

  const handleCreateRoom = async () => {
    if (!propertyId) return
    if (!createNewType && roomTypes.length === 0) {
      alert('Cadastre um tipo de quarto primeiro ou selecione "Criar novo tipo".')
      return
    }
    let roomTypeId = formRoomTypeId
    if (createNewType) {
      if (!newTypeName.trim()) return alert('Informe o nome do tipo de quarto.')
      const price = parseFloat(newTypeBasePrice)
      if (isNaN(price) || price < 0) return alert('Preço inválido.')
      setSaving(true)
      try {
        const created = await apiFetch<RoomType>('/rooms/types', {
          method: 'POST',
          body: JSON.stringify({
            propertyId,
            name: newTypeName.trim(),
            maxGuests: newTypeMaxGuests,
            basePrice: price,
          }),
        })
        roomTypeId = created.id
      } catch (e) {
        setSaving(false)
        alert((e as { message?: string })?.message || 'Erro ao criar tipo.')
        return
      }
    }
    if (!formNumber.trim()) return alert('Informe o número do quarto.')
    setSaving(true)
    try {
      await apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          propertyId,
          roomTypeId,
          number: formNumber.trim(),
          floor: formFloor,
          notes: formNotes.trim() || undefined,
        }),
      })
      resetForm()
      setModalOpen(null)
      loadData()
    } catch (e) {
      alert((e as { message?: string })?.message || 'Erro ao criar quarto.')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateRoom = async () => {
    if (!editRoom) return
    if (!formNumber.trim()) return alert('Informe o número do quarto.')
    setSaving(true)
    try {
      await apiFetch(`/rooms/${editRoom.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          number: formNumber.trim(),
          roomTypeId: formRoomTypeId,
          floor: formFloor,
          notes: formNotes.trim() || undefined,
        }),
      })
      resetForm()
      setModalOpen(null)
      loadData()
    } catch (e) {
      alert((e as { message?: string })?.message || 'Erro ao atualizar quarto.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (roomId: string, newStatus: string) => {
    try {
      await apiFetch(`/rooms/${roomId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      loadData()
    } catch (e) {
      alert((e as { message?: string })?.message || 'Erro ao alterar status.')
    }
  }

  if (!propertyId) return <p className="text-[#6B7280]">Nenhuma propriedade selecionada.</p>
  if (loading) return <RoomsSkeleton />
  if (error) return <p className="text-red-600">{error}</p>

  const selectedType = roomTypes.find((t) => t.id === formRoomTypeId)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1E3A5F]">Quartos</h1>
        <button type="button" onClick={openAddModal} className="btn-primary">
          Adicionar Quarto
        </button>
      </div>

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F1EC] border-b border-[#D1D5DB]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1E3A5F]">Número</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1E3A5F]">Tipo</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1E3A5F]">Capacidade</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1E3A5F]">Preço</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1E3A5F]">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1E3A5F]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => {
                const statusInfo = STATUS_MAP[room.status] ?? STATUS_OPTIONS[0]
                return (
                  <tr key={room.id} className="border-b border-[#D1D5DB]/50 hover:bg-[#FAFAF8]/50">
                    <td className="py-3 px-4 font-medium text-[#1E3A5F]">{room.number}</td>
                    <td className="py-3 px-4 text-[#6B7280]">{room.roomType?.name ?? '-'}</td>
                    <td className="py-3 px-4 text-[#6B7280]">
                      {room.roomType?.maxGuests ?? 0} {room.roomType?.maxGuests === 1 ? 'pessoa' : 'pessoas'}
                    </td>
                    <td className="py-3 px-4 text-[#6B7280]">
                      {formatPrice(room.roomType?.basePrice ?? 0)}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={room.status}
                        onChange={(e) => handleStatusChange(room.id, e.target.value)}
                        className={`input-default py-1.5 px-2 text-sm font-medium w-fit min-w-[130px] ${statusInfo.color} border`}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => openEditModal(room)}
                        className="text-[#4A6FA5] hover:text-[#2C5282] text-sm font-medium"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {rooms.length === 0 && (
          <div className="py-12 text-center text-[#6B7280]">
            Nenhum quarto cadastrado. Clique em &quot;Adicionar Quarto&quot; para começar.
          </div>
        )}
      </div>

      {/* Modal Adicionar / Editar Quarto */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card-base w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#1E3A5F] mb-4">
              {modalOpen === 'add' ? 'Adicionar Quarto' : 'Editar Quarto'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Número do quarto</label>
                <input
                  type="text"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  className="input-default"
                  placeholder="Ex: 101"
                />
              </div>

              {modalOpen === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-[#1E3A5F] mb-2">Tipo do quarto</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!createNewType}
                        onChange={() => setCreateNewType(false)}
                        className="text-[#4A6FA5]"
                      />
                      <span className="text-[#6B7280]">Usar tipo existente</span>
                    </label>
                    {!createNewType && (
                      <select
                        value={formRoomTypeId}
                        onChange={(e) => setFormRoomTypeId(e.target.value)}
                        className="input-default mt-1"
                      >
                        {roomTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} — {t.maxGuests} pess. — {formatPrice(t.basePrice)}
                          </option>
                        ))}
                        {roomTypes.length === 0 && (
                          <option value="">Nenhum tipo cadastrado</option>
                        )}
                      </select>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="radio"
                        checked={createNewType}
                        onChange={() => setCreateNewType(true)}
                        className="text-[#4A6FA5]"
                      />
                      <span className="text-[#6B7280]">Criar novo tipo</span>
                    </label>
                    {createNewType && (
                      <div className="mt-2 space-y-2 pl-6 border-l-2 border-[#D1D5DB]">
                        <input
                          type="text"
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          className="input-default"
                          placeholder="Nome (ex: Standard, Luxo)"
                        />
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-[#6B7280]">Capacidade</label>
                            <input
                              type="number"
                              min={1}
                              value={newTypeMaxGuests}
                              onChange={(e) => setNewTypeMaxGuests(parseInt(e.target.value, 10) || 1)}
                              className="input-default"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-[#6B7280]">Preço (R$)</label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={newTypeBasePrice}
                              onChange={(e) => setNewTypeBasePrice(e.target.value)}
                              className="input-default"
                              placeholder="180"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {modalOpen === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Tipo do quarto</label>
                  <select
                    value={formRoomTypeId}
                    onChange={(e) => setFormRoomTypeId(e.target.value)}
                    className="input-default"
                  >
                    {roomTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.maxGuests} pess. — {formatPrice(t.basePrice)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(createNewType || modalOpen === 'edit') && selectedType && !createNewType && (
                <div className="text-sm text-[#6B7280]">
                  Capacidade: {selectedType.maxGuests} pessoas · Preço: {formatPrice(selectedType.basePrice)}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Andar</label>
                <input
                  type="number"
                  min={1}
                  value={formFloor}
                  onChange={(e) => setFormFloor(parseInt(e.target.value, 10) || 1)}
                  className="input-default"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Observações (opcional)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="input-default min-h-[80px]"
                  placeholder="Ex: Vista para o mar"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setModalOpen(null)
                }}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={modalOpen === 'add' ? handleCreateRoom : handleUpdateRoom}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
