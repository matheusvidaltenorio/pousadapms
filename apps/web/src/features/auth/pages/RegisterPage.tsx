import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * Página de registro de novo usuário.
 * Campos: Nome, Email, Senha, Confirmar senha.
 * Após sucesso: redireciona para login.
 */
export function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao criar conta')
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F1EC] p-6">
        <div className="bg-[#FAFAF8] rounded-[10px] shadow-card p-8 max-w-md text-center">
          <p className="text-lg font-medium text-green-700 mb-2">Conta criada com sucesso!</p>
          <p className="text-[#6B7280] text-sm">Redirecionando para o login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
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
          <p className="text-sm opacity-80">Crie sua conta no Pousada PMS</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#F4F1EC] p-6">
        <div className="w-full max-w-md">
          <div className="bg-[#FAFAF8] rounded-[10px] shadow-card p-8 border border-[#D1D5DB]/50">
            <h1 className="text-2xl font-bold text-[#1E3A5F] text-center mb-2">
              Registro de usuário
            </h1>
            <p className="text-sm text-[#6B7280] text-center mb-8">
              Crie uma conta para acessar o sistema
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-default"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
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
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1E3A5F] mb-1">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-default"
                  placeholder="Repita a senha"
                  required
                  minLength={6}
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
                {loading ? 'Criando conta...' : 'Criar conta'}
              </button>
              <p className="text-center text-sm text-[#6B7280]">
                Já tem conta?{' '}
                <Link to="/login" className="text-[#4A6FA5] font-medium hover:underline">
                  Fazer login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
