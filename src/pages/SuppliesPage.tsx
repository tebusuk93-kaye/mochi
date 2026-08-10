import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { generateId, supplyUnitCost, formatCurrency, formatCAD, formatUnit } from '../lib/calculations'
import type { Supply, SupplyCategory, Unit, Currency } from '../types'
import { Button, Card, Input, PageHeader, Select, EmptyState, FormError } from '../components/ui'

const categoryOptions: { value: SupplyCategory; label: string }[] = [
  { value: 'ingredient', label: 'Ingredient' },
  { value: 'packaging_individual', label: 'Individual wrapper' },
  { value: 'packaging_inner', label: 'Inner wrapper (for boxes)' },
  { value: 'packaging_box', label: 'Box (holds 4)' },
]

const unitOptions: { value: Unit; label: string }[] = [
  { value: 'g', label: 'g (grams)' },
  { value: 'ml', label: 'ml' },
  { value: 'piece', label: '個 (per piece — peach, strawberry, etc.)' },
]

const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'CAD', label: 'CAD' },
  { value: 'JPY', label: 'JPY' },
]

export function SuppliesPage() {
  const { data, updateData } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    category: 'ingredient' as SupplyCategory,
    unit: 'g' as Unit,
    packageSize: '',
    packageCost: '',
    currency: 'CAD' as Currency,
    notes: '',
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Please enter a name.')
      return
    }
    const packageSize = parseFloat(form.packageSize)
    const packageCost = parseFloat(form.packageCost)
    if (!form.packageSize || Number.isNaN(packageSize) || packageSize <= 0) {
      setError('Please enter a valid package size greater than 0.')
      return
    }
    if (!form.packageCost || Number.isNaN(packageCost) || packageCost < 0) {
      setError('Please enter a valid package cost.')
      return
    }

    const supply: Supply = {
      id: generateId(),
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
      packageSize,
      packageCost,
      currency: form.currency,
      notes: form.notes || undefined,
    }

    updateData((prev) => ({ ...prev, supplies: [...prev.supplies, supply] }))
    setForm({ name: '', category: 'ingredient', unit: 'g', packageSize: '', packageCost: '', currency: 'CAD', notes: '' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      supplies: prev.supplies.filter((s) => s.id !== id),
    }))
  }

  const grouped = {
    ingredient: data.supplies.filter((s) => s.category === 'ingredient'),
    packaging: data.supplies.filter((s) => s.category !== 'ingredient'),
  }

  return (
    <div>
      <PageHeader
        title="Supplies"
        subtitle="Ingredients & packaging — enter package size and cost"
      />

      <Button onClick={() => { setShowForm(!showForm); setError('') }} className="w-full mb-4 flex items-center justify-center gap-2">
        <Plus size={18} />
        Add Supply
      </Button>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            {error && <FormError message={error} />}
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Peach, Glutinous rice flour" />
            <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v as SupplyCategory })} options={categoryOptions} />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label={form.unit === 'piece' ? 'Package count (個)' : 'Package size'}
                value={form.packageSize}
                onChange={(v) => setForm({ ...form, packageSize: v })}
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                placeholder={form.unit === 'piece' ? 'e.g. 6' : 'e.g. 500'}
                hint={form.unit === 'piece' ? 'How many pieces in one purchase (e.g. 6 peaches)' : undefined}
              />
              <Select label="Unit" value={form.unit} onChange={(v) => setForm({ ...form, unit: v as Unit })} options={unitOptions} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input label="Package cost" value={form.packageCost} onChange={(v) => setForm({ ...form, packageCost: v })} type="number" step="any" min="0" inputMode="decimal" placeholder="e.g. 450" />
              <Select label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v as Currency })} options={currencyOptions} />
            </div>
            <Input label="Notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Save</Button>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setError('') }}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <SupplyGroup title="Ingredients" items={grouped.ingredient} jpyToCad={data.settings.jpyToCad} onDelete={handleDelete} />
      <SupplyGroup title="Packaging" items={grouped.packaging} jpyToCad={data.settings.jpyToCad} onDelete={handleDelete} />

      {data.supplies.length === 0 && !showForm && (
        <EmptyState message="Add your first supply. Example: 6 peaches (個) for $5, or 500g flour for ¥450." />
      )}
    </div>
  )
}

function SupplyGroup({
  title,
  items,
  jpyToCad,
  onDelete,
}: {
  title: string
  items: Supply[]
  jpyToCad: number
  onDelete: (id: string) => void
}) {
  if (items.length === 0) return null

  return (
    <section className="mb-4">
      <h2 className="text-sm font-semibold text-ink-muted mb-2">{title}</h2>
      <div className="space-y-2">
        {items.map((s) => {
          const unitCostCAD = supplyUnitCost(s, jpyToCad)
          const unit = formatUnit(s.unit)
          return (
            <Card key={s.id}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-ink-muted">
                    {s.packageSize}{unit} for {formatCurrency(s.packageCost, s.currency)}
                  </div>
                  <div className="text-xs text-matcha-dark mt-0.5">
                    {formatCAD(unitCostCAD)}/{unit}
                  </div>
                </div>
                <button onClick={() => onDelete(s.id)} className="text-sakura p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
