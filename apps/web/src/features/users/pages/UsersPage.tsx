import { useEffect, useState } from 'react'
import { apiFetch } from '@/shared/api/client'
import { useProperty } from '@/shared/hooks/useProperty'

const ROLE_LABELS: Record<string, string> = {
  user: 'Usuário',
  receptionist: 'Recepcionista',
  admin: 'Administrador',
  manager: 'Gerente',
  housekeeping: 'Limpeza',
}

const ROLE_OPTIONS = [
  { value: 'user', label: 'Usuário' },
  { value: 'receptionist', label: 'Recepcionista' },
  { value: 'admin', label: 'Administrador' },
]

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  isActive: boolean
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '-'
  }
}

/**
 * Página Gerenciar Usuários - apenas para administradores.
 */
export function UsersPage() {
  const propertyId = useProperty()
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadUsers = () => {
    if (!propertyId) return
    apiFetch<UserItem[]>(`/users?propertyId=${propertyId}`)
      .then(setUsers)
      .catch((e) => setError((e as { message?: string })?.message || 'Erro ao carregar usuários'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [propertyId])

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!propertyId) return
    try {
      await apiFetch(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ propertyId, role: newRole }),
      })
      loadUsers()
    } catch (e) {
      alert((e as { message?: string })?.message || 'Erro ao alterar tipo')
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Desativar o usuário "${userName}"? Ele não poderá mais fazer login.`)) return
    try {
      await apiFetch(`/users/${userId}?propertyId=${propertyId}`, {
        method: 'DELETE',
      })
      loadUsers()
    } catch (e) {
      alert((e as { message?: string })?.message || 'Erro ao excluir')
    }
  }

  if (!propertyId) return <p className="text-[#6B7280]">Nenhuma propriedade selecionada.</p>
  if (loading) return <p className="text-[#6B7280]">Carregando usuários...</p>
  if (error) return <p className="text-red-600">{error}</p>

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A5F] mb-6">Gerenciar Usuários</h1>
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F4F1EC] border-b border-[#D1D5DB]">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1E3A5F]">Nome</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1E3A5F]">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1E3A5F]">Tipo</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1E3A5F]">Data de criação</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-[#1E3A5F]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-[#D1D5DB]/50 hover:bg-[#FAFAF8]/50">
                  <td className="py-3 px-4 font-medium text-[#1E3A5F]">
                    {u.name}
                    {!u.isActive && (
                      <span className="ml-2 text-xs text-red-600 font-normal">(desativado)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[#6B7280]">{u.email}</td>
                  <td className="py-3 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={!u.isActive}
                      className="input-default py-1.5 px-2 text-sm w-fit min-w-[130px]"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-[#6B7280]">{formatDate(u.createdAt)}</td>
                  <td className="py-3 px-4">
                    {u.isActive && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id, u.name)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Excluir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="py-12 text-center text-[#6B7280]">Nenhum usuário encontrado.</div>
        )}
      </div>
    </div>
  )
}
