import { Trash2 } from 'lucide-react'
import type { AmountBasis, Supply } from '../types'
import { formatUnit } from '../lib/calculations'
import { Input, Select } from './ui'

export interface IngredientFormRow {
  supplyId: string
  amount: string
  amountBasis: AmountBasis
}

export function emptyIngredientRow(): IngredientFormRow {
  return { supplyId: '', amount: '', amountBasis: 'per_unit' }
}

interface IngredientRowsProps {
  title: string
  hint?: string
  rows: IngredientFormRow[]
  supplies: Supply[]
  productType: 'mochi' | 'onigiri'
  onChange: (rows: IngredientFormRow[]) => void
  defaultBasis?: AmountBasis
}

export function IngredientRows({
  title,
  hint,
  rows,
  supplies,
  productType,
  onChange,
  defaultBasis = 'per_batch',
}: IngredientRowsProps) {
  const supplyOptions = supplies.map((s) => ({
    value: s.id,
    label: `${s.name} (${formatUnit(s.unit)})`,
  }))

  const updateRow = (idx: number, patch: Partial<IngredientFormRow>) => {
    const updated = [...rows]
    updated[idx] = { ...updated[idx], ...patch }
    onChange(updated)
  }

  const addRow = () => {
    onChange([...rows, { supplyId: '', amount: '', amountBasis: defaultBasis }])
  }

  const removeRow = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx))
  }

  const unitLabel = productType === 'mochi' ? 'mochi' : 'onigiri'

  return (
    <div>
      <div className="text-sm font-medium text-ink-muted mb-1">{title}</div>
      {hint && <div className="text-xs text-ink-muted mb-2">{hint}</div>}

      {supplies.length === 0 ? (
        <div className="text-xs text-sakura-dark bg-sakura/10 rounded-xl px-3 py-2 mb-2">
          Add ingredients in Supplies first (e.g. peach, strawberry, rice).
        </div>
      ) : (
        <div className="space-y-2 mb-2">
          {rows.map((row, idx) => {
            const supply = supplies.find((s) => s.id === row.supplyId)
            const unit = supply ? formatUnit(supply.unit) : '—'
            return (
              <div key={idx} className="bg-cream rounded-xl p-2 space-y-2">
                <Select
                  label="Ingredient"
                  value={row.supplyId}
                  onChange={(v) => updateRow(idx, { supplyId: v })}
                  options={[{ value: '', label: 'Select...' }, ...supplyOptions]}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label={`Amount (${unit})`}
                    value={row.amount}
                    onChange={(v) => updateRow(idx, { amount: v })}
                    type="number"
                    step="any"
                    min="0"
                    inputMode="decimal"
                    placeholder={supply?.unit === 'piece' ? 'e.g. 0.25' : 'e.g. 200'}
                  />
                  <Select
                    label="Basis"
                    value={row.amountBasis}
                    onChange={(v) => updateRow(idx, { amountBasis: v as AmountBasis })}
                    options={[
                      { value: 'per_unit', label: `Per ${unitLabel}` },
                      { value: 'per_batch', label: 'Per batch' },
                    ]}
                  />
                </div>
                {row.amountBasis === 'per_unit' && supply?.unit === 'piece' && (
                  <div className="text-xs text-ink-muted">
                    e.g. 0.25 = ¼ peach per {unitLabel}, 1 = one whole per {unitLabel}
                  </div>
                )}
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-xs text-sakura flex items-center gap-1"
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        disabled={supplies.length === 0}
        className="text-xs text-matcha-dark font-medium disabled:opacity-50"
      >
        + Add ingredient
      </button>
    </div>
  )
}

export function toFormRows(ingredients: { supplyId: string; amount: number; amountBasis: AmountBasis }[]): IngredientFormRow[] {
  if (ingredients.length === 0) return []
  return ingredients.map((i) => ({
    supplyId: i.supplyId,
    amount: String(i.amount),
    amountBasis: i.amountBasis,
  }))
}

export function parseIngredientRows(
  rows: IngredientFormRow[],
): { supplyId: string; amount: number; amountBasis: AmountBasis }[] {
  return rows
    .filter((r) => r.supplyId && r.amount)
    .map((r) => ({
      supplyId: r.supplyId,
      amount: parseFloat(r.amount),
      amountBasis: r.amountBasis,
    }))
    .filter((r) => !Number.isNaN(r.amount) && r.amount > 0)
}
