/**
 * Retorna o ID da propriedade ativa armazenada no localStorage.
 * Usado para filtrar dados por pousada (multi-tenant).
 */
export function useProperty(): string | null {
  const stored = localStorage.getItem('currentProperty')
  if (!stored) return null
  try {
    const parsed = JSON.parse(stored) as { id: string; name: string }
    return parsed?.id ?? null
  } catch {
    return null
  }
}
