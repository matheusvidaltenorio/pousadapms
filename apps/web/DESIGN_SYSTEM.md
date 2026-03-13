# Design System - Pousada PMS

Identidade visual profissional com foco em **segurança**, **confiabilidade**, **tranquilidade** e **profissionalismo**.

## Paleta de Cores

| Nome | Hex | Uso |
|------|-----|-----|
| Azul profundo | `#1E3A5F` | Sidebar, botão principal, títulos |
| Azul suave | `#4A6FA5` | Hover, foco em inputs |
| Hover do botão | `#2C5282` | Estado hover dos botões |
| Bege claro | `#F4F1EC` | Background principal |
| Branco suave | `#FAFAF8` | Cards, inputs |
| Cinza neutro | `#6B7280` | Textos secundários |
| Bordas | `#D1D5DB` | Bordas suaves |

## Classes Reutilizáveis (`src/index.css`)

- **`.input-default`** – Inputs padronizados (borda cinza, focus azul)
- **`.btn-primary`** – Botão principal (azul profundo)
- **`.btn-secondary`** – Botão secundário (borda, fundo claro)
- **`.card-base`** – Cards com sombra leve e bordas arredondadas

## Tailwind – cores customizadas

```
bg-brand-deep, bg-brand-soft, bg-surface-light, bg-surface-white
text-brand-deep, text-[#6B7280]
border-neutral-border
shadow-card, shadow-cardHover
```

## Manter o padrão visual

1. **Inputs:** use `className="input-default"`
2. **Botões principais:** use `className="btn-primary"`
3. **Botões secundários:** use `className="btn-secondary"`
4. **Cards:** use `className="card-base"`
5. **Cores:** prefira `text-[#1E3A5F]`, `text-[#6B7280]`, `bg-[#FAFAF8]` ou as classes do Tailwind
6. **Evite:** branco puro (#FFF), cores muito fortes ou agressivas

## Imagem do Padre Cícero

A tela de login usa a imagem em `public/padre-cicero.png` com overlay azul suave. Para trocar a imagem, substitua o arquivo em `apps/web/public/padre-cicero.png`.

## Tipografia

- **Fonte:** Inter (Google Fonts)
- **Títulos:** `text-2xl font-bold text-[#1E3A5F]`
- **Texto secundário:** `text-sm text-[#6B7280]`
