import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface rounded-2xl border border-border p-4 shadow-sm ${onClick ? 'active:scale-[0.98] transition-transform cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  type?: 'button' | 'submit'
  className?: string
  disabled?: boolean
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  className = '',
  disabled,
}: ButtonProps) {
  const variants = {
    primary: 'bg-matcha text-white active:bg-matcha-dark',
    secondary: 'bg-cream-dark text-ink active:bg-border',
    danger: 'bg-sakura text-white active:bg-sakura-dark',
    ghost: 'bg-transparent text-ink-muted active:bg-cream-dark',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

interface InputProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  hint?: string
  step?: string
  min?: string
  inputMode?: 'decimal' | 'numeric' | 'text'
}

export function Input({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  step,
  min,
  inputMode,
}: InputProps) {
  return (
    <label className="block space-y-1">
      {label && <span className="text-sm font-medium text-ink-muted">{label}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={step}
        min={min}
        inputMode={inputMode}
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-matcha/40"
      />
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </label>
  )
}

interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export function Select({ label, value, onChange, options }: SelectProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-ink-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-matcha/40"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      {subtitle && <p className="text-sm text-ink-muted mt-0.5">{subtitle}</p>}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-ink-muted text-sm">{message}</div>
  )
}

export function FormError({ message }: { message: string }) {
  return (
    <div className="text-sm text-sakura-dark bg-sakura/10 border border-sakura/30 rounded-xl px-3 py-2">
      {message}
    </div>
  )
}

export function StatBox({
  label,
  value,
  subValue,
  variant = 'default',
}: {
  label: string
  value: string
  subValue?: string
  variant?: 'default' | 'positive' | 'negative'
}) {
  const colors = {
    default: 'text-ink',
    positive: 'text-matcha-dark',
    negative: 'text-sakura-dark',
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-3">
      <div className="text-xs text-ink-muted mb-1">{label}</div>
      <div className={`text-lg font-bold ${colors[variant]}`}>{value}</div>
      {subValue && <div className="text-xs text-ink-muted mt-0.5">{subValue}</div>}
    </div>
  )
}
