import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Tela de login.
 * Layout: imagem Padre Cícero (esquerda) + card de login (direita).
 * Design: paleta suave, identidade Juazeiro do Norte.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao fazer login')
      localStorage.setItem('token', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      if (data.currentProperty) {
        localStorage.setItem('currentProperty', JSON.stringify(data.currentProperty))
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo: imagem Padre Cícero com overlay */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-[#1E3A5F] overflow-hidden"
        style={{
          backgroundImage: 'url(/padre-cicero.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(rgba(30,58,95,0.75), rgba(30,58,95,0.75))',
          }}
        />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white/90">
          <p className="text-lg font-medium">Juazeiro do Norte</p>
          <p className="text-sm opacity-80">Referência ao Padre Cícero</p>
        </div>
      </div>

      {/* Lado direito: card de login */}
      <div className="flex-1 flex items-center justify-center bg-[#F4F1EC] p-6">
        <div className="w-full max-w-md">
          <div className="bg-[#FAFAF8] rounded-[10px] shadow-card p-8 border border-[#D1D5DB]/50">
            <h1 className="text-2xl font-bold text-[#1E3A5F] text-center mb-2">Pousada PMS</h1>
            <p className="text-sm text-[#6B7280] text-center mb-8">
              Sistema de Gestão de Pousadas
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-default"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-default"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50/80 p-3 rounded-lg border border-red-200">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
