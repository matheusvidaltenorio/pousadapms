import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'

/**
 * Layout principal - sidebar azul profundo, conteúdo em fundo bege.
 * Padrão visual: segurança, profissionalismo, tranquilidade.
 */
export function MainLayout() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('currentProperty')
    navigate('/login')
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3 py-2 rounded-lg transition-colors ${
      isActive ? 'bg-[#4A6FA5] text-[#FAFAF8] font-medium' : 'text-[#FAFAF8]/90 hover:bg-[#4A6FA5]'
    }`

  return (
    <div className="min-h-screen flex bg-[#F4F1EC]">
      <aside className="w-64 bg-[#1E3A5F] flex flex-col shrink-0">
        <div className="p-5 border-b border-[#1E3A5F]/80">
          <h2 className="font-bold text-lg text-[#FAFAF8]">Pousada PMS</h2>
          <p className="text-xs text-[#FAFAF8]/70 truncate mt-0.5">{user?.name}</p>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/rooms" className={navLinkClass}>
            Quartos
          </NavLink>
          <NavLink to="/guests" className={navLinkClass}>
            Hóspedes
          </NavLink>
          <NavLink to="/bookings" className={navLinkClass}>
            Reservas
          </NavLink>
          <NavLink to="/calendar" className={navLinkClass}>
            Calendário
          </NavLink>
          <NavLink to="/financial" className={navLinkClass}>
            Fechamento
          </NavLink>
          <NavLink to="/expenses" className={navLinkClass}>
            Despesas
          </NavLink>
          <NavLink to="/integrations" className={navLinkClass}>
            Integrações
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/users" className={navLinkClass}>
              Gerenciar Usuários
            </NavLink>
          )}
          <Link
            to="/bookings/new"
            className="block px-3 py-2 rounded-lg mt-4 bg-[#4A6FA5] text-[#FAFAF8] text-center font-medium hover:bg-[#2C5282] transition-colors"
          >
            + Nova Reserva
          </Link>
        </nav>
        <div className="p-4 border-t border-[#1E3A5F]/80">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-[#FAFAF8]/80 hover:bg-[#4A6FA5] hover:text-[#FAFAF8] transition-colors text-sm"
          >
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
