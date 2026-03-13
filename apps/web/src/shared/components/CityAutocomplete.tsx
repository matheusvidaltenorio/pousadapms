/**
 * Autocomplete de cidade brasileira usando API do IBGE.
 * Ao digitar, busca municípios e preenche automaticamente cidade + estado.
 */
import { useState, useEffect, useRef } from 'react'

interface Municipio {
  id: number
  nome: string
  'regiao-imediata'?: { id: number; nome: string }
  UF?: { id: number; sigla: string; nome: string }
}

const IBGE_URL = 'https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome'

export interface CityValue {
  city: string
  state: string
}

interface CityAutocompleteProps {
  value: CityValue
  onChange: (value: CityValue) => void
  placeholder?: string
  className?: string
}

export function CityAutocomplete({ value, onChange, placeholder = 'Cidade', className = '' }: CityAutocompleteProps) {
  const [municipios, setMunicipios] = useState<Municipio[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState(value.city || '')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(IBGE_URL)
      .then((r) => r.json())
      .then(setMunicipios)
      .catch(() => setMunicipios([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search.trim().length >= 2
    ? municipios.filter(
        (m) =>
          m.nome.toLowerCase().includes(search.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')),
      ).slice(0, 15)
    : []

  const handleSelect = (m: Municipio) => {
    onChange({ city: m.nome, state: m.UF?.sigla || '' })
    setSearch(m.nome)
    setOpen(false)
  }

  const handleBlur = () => {
    setTimeout(() => setOpen(false), 150)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Enter' && filtered[highlight]) {
      e.preventDefault()
      handleSelect(filtered[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setOpen(true)
          setHighlight(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={loading ? 'Carregando cidades...' : placeholder}
        disabled={loading}
        className={`w-full px-3 py-2 border rounded-md ${value.state ? 'pr-12' : ''}`}
      />
      {value.state && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium">
          {value.state}
        </span>
      )}
      {open && search.trim().length >= 2 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-gray-500 text-sm">Nenhuma cidade encontrada</li>
          ) : (
            filtered.map((m, i) => (
              <li
                key={m.id}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(m)
                }}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  i === highlight ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50'
                }`}
              >
                {m.nome} — {m.UF?.sigla || ''}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
