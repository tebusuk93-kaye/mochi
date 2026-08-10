import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  assetDepreciationPerUnit,
  formatCAD,
  formatCurrency,
  generateId,
} from '../lib/calculations'
import type { FixedAsset, Currency } from '../types'
import { Button, Card, Input, PageHeader, Select, EmptyState } from '../components/ui'

const categoryOptions = [
  { value: 'equipment', label: 'Equipment' },
  { value: 'reusable_packaging', label: 'Reusable packaging' },
]

const currencyOptions: { value: Currency; label: string }[] = [
  { value: 'CAD', label: 'CAD' },
  { value: 'JPY', label: 'JPY' },
]

export function AssetsPage() {
  const { data, updateData } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: 'equipment' as FixedAsset['category'],
    totalCost: '',
    currency: 'CAD' as Currency,
    expectedTotalUnits: '',
    notes: '',
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.totalCost || !form.expectedTotalUnits) return

    const asset: FixedAsset = {
      id: generateId(),
      name: form.name,
      category: form.category,
      totalCost: parseFloat(form.totalCost),
      currency: form.currency,
      expectedTotalUnits: parseFloat(form.expectedTotalUnits),
      notes: form.notes || undefined,
    }

    updateData((prev) => ({ ...prev, fixedAssets: [...prev.fixedAssets, asset] }))
    setForm({ name: '', category: 'equipment', totalCost: '', currency: 'CAD', expectedTotalUnits: '', notes: '' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      fixedAssets: prev.fixedAssets.filter((a) => a.id !== id),
    }))
  }

  const totalDepPerUnit = data.fixedAssets.reduce(
    (sum, a) => sum + assetDepreciationPerUnit(a, data.settings.jpyToCad),
    0,
  )

  return (
    <div>
      <PageHeader
        title="Fixed Assets"
        subtitle="Equipment & reusable packaging — depreciated per mochi"
      />

      {data.fixedAssets.length > 0 && (
        <Card className="mb-4 bg-matcha/5 border-matcha/20">
          <div className="text-sm text-ink-muted">Total depreciation per unit</div>
          <div className="text-xl font-bold text-matcha-dark">{formatCAD(totalDepPerUnit)}</div>
          <div className="text-xs text-ink-muted mt-1">
            Added to each mochi's cost when "with depreciation" is shown
          </div>
        </Card>
      )}

      <Button onClick={() => setShowForm(!showForm)} className="w-full mb-4 flex items-center justify-center gap-2">
        <Plus size={18} />
        Add Asset
      </Button>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Steamer" />
            <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v as FixedAsset['category'] })} options={categoryOptions} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Total cost" value={form.totalCost} onChange={(v) => setForm({ ...form, totalCost: v })} type="number" />
              <Select label="Currency" value={form.currency} onChange={(v) => setForm({ ...form, currency: v as Currency })} options={currencyOptions} />
            </div>
            <Input
              label="Expected total units over lifetime"
              value={form.expectedTotalUnits}
              onChange={(v) => setForm({ ...form, expectedTotalUnits: v })}
              type="number"
              hint="e.g. steamer used for 5,000 mochi → enter 5000"
            />
            <Input label="Notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Save</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {data.fixedAssets.length === 0 && !showForm ? (
        <EmptyState message="Add equipment or reusable packaging. Depreciation is split evenly across all units you expect to produce." />
      ) : (
        <div className="space-y-2">
          {data.fixedAssets.map((a) => {
            const dep = assetDepreciationPerUnit(a, data.settings.jpyToCad)
            return (
              <Card key={a.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-ink-muted">
                      {a.category === 'equipment' ? 'Equipment' : 'Reusable packaging'} ·{' '}
                      {formatCurrency(a.totalCost, a.currency)} ÷ {a.expectedTotalUnits} units
                    </div>
                    <div className="text-xs text-matcha-dark mt-0.5">
                      {formatCAD(dep)}/unit
                    </div>
                  </div>
                  <button onClick={() => handleDelete(a.id)} className="text-sakura p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
