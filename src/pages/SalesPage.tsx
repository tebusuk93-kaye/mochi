import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCAD, generateId } from '../lib/calculations'
import type { ProductType } from '../types'
import { Button, Card, Input, PageHeader, Select, EmptyState } from '../components/ui'

export function SalesPage() {
  const { data, updateData } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    productSource: 'mochi' as 'mochi' | 'onigiri' | 'imported' | 'custom',
    recipeId: '',
    importedProductId: '',
    customName: '',
    customType: 'mochi' as ProductType,
    quantity: '',
    unitPriceCAD: '',
    productionEntryId: '',
    notes: '',
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.quantity || !form.unitPriceCAD) return

    let productName = ''
    let productType: ProductType = 'mochi'

    if (form.productSource === 'mochi' && form.recipeId) {
      const recipe = data.recipes.find((r) => r.id === form.recipeId && r.productType === 'mochi')
      if (!recipe) return
      productName = recipe.name
      productType = 'mochi'
    } else if (form.productSource === 'onigiri' && form.recipeId) {
      const recipe = data.recipes.find((r) => r.id === form.recipeId && r.productType === 'onigiri')
      if (!recipe) return
      productName = recipe.name
      productType = 'onigiri'
    } else if (form.productSource === 'imported' && form.importedProductId) {
      const product = data.importedProducts.find((p) => p.id === form.importedProductId)
      if (!product) return
      productName = product.name
      productType = product.productType
    } else if (form.productSource === 'custom' && form.customName) {
      productName = form.customName
      productType = form.customType
    } else {
      return
    }

    const entry = {
      id: generateId(),
      date: form.date,
      productType,
      productName,
      quantity: parseFloat(form.quantity),
      unitPriceCAD: parseFloat(form.unitPriceCAD),
      productionEntryId: form.productionEntryId || undefined,
      notes: form.notes || undefined,
    }

    updateData((prev) => ({ ...prev, sales: [...prev.sales, entry] }))
    setForm({
      date: new Date().toISOString().slice(0, 10),
      productSource: 'mochi',
      recipeId: '',
      importedProductId: '',
      customName: '',
      customType: 'mochi',
      quantity: '',
      unitPriceCAD: '',
      productionEntryId: '',
      notes: '',
    })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      sales: prev.sales.filter((s) => s.id !== id),
    }))
  }

  const sorted = [...data.sales].sort((a, b) => b.date.localeCompare(a.date))

  const productionOptions = data.production.map((p) => ({
    value: p.id,
    label: `${p.date} — ${p.productName} (${p.quantity} units)`,
  }))

  const totalRevenue = sorted.reduce((s, sale) => s + sale.quantity * sale.unitPriceCAD, 0)
  const totalUnits = sorted.reduce((s, sale) => s + sale.quantity, 0)

  return (
    <div>
      <PageHeader
        title="Sales Log"
        subtitle="Track actual sales vs estimates"
      />

      {sorted.length > 0 && (
        <Card className="mb-4 bg-sakura/5 border-sakura/20">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-ink-muted text-xs">Total revenue</div>
              <div className="font-bold text-lg">{formatCAD(totalRevenue)}</div>
            </div>
            <div>
              <div className="text-ink-muted text-xs">Units sold</div>
              <div className="font-bold text-lg">{totalUnits}</div>
            </div>
          </div>
        </Card>
      )}

      <Button onClick={() => setShowForm(!showForm)} className="w-full mb-4 flex items-center justify-center gap-2">
        <Plus size={18} />
        Log Sale
      </Button>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <Input label="Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" />

            <Select
              label="Product source"
              value={form.productSource}
              onChange={(v) => setForm({ ...form, productSource: v as typeof form.productSource })}
              options={[
                { value: 'mochi', label: 'Mochi recipe' },
                { value: 'onigiri', label: 'Onigiri recipe' },
                { value: 'imported', label: 'Rice cracker (imported)' },
                { value: 'custom', label: 'Custom name' },
              ]}
            />

            {form.productSource === 'mochi' && (
              <Select
                label="Mochi flavor"
                value={form.recipeId}
                onChange={(v) => setForm({ ...form, recipeId: v })}
                options={[{ value: '', label: 'Select...' }, ...data.recipes.filter((r) => r.productType === 'mochi').map((r) => ({ value: r.id, label: r.name }))]}
              />
            )}

            {form.productSource === 'onigiri' && (
              <Select
                label="Onigiri recipe"
                value={form.recipeId}
                onChange={(v) => setForm({ ...form, recipeId: v })}
                options={[{ value: '', label: 'Select...' }, ...data.recipes.filter((r) => r.productType === 'onigiri').map((r) => ({ value: r.id, label: r.name }))]}
              />
            )}

            {form.productSource === 'imported' && (
              <Select
                label="Product"
                value={form.importedProductId}
                onChange={(v) => setForm({ ...form, importedProductId: v })}
                options={[{ value: '', label: 'Select...' }, ...data.importedProducts.map((p) => ({ value: p.id, label: p.name }))]}
              />
            )}

            {form.productSource === 'custom' && (
              <>
                <Input label="Product name" value={form.customName} onChange={(v) => setForm({ ...form, customName: v })} />
                <Select
                  label="Type"
                  value={form.customType}
                  onChange={(v) => setForm({ ...form, customType: v as ProductType })}
                  options={[
                    { value: 'mochi', label: 'Mochi' },
                    { value: 'onigiri', label: 'Onigiri' },
                    { value: 'rice_cracker', label: 'Rice cracker' },
                  ]}
                />
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Input label="Quantity sold" value={form.quantity} onChange={(v) => setForm({ ...form, quantity: v })} type="number" />
              <Input label="Unit price (CAD)" value={form.unitPriceCAD} onChange={(v) => setForm({ ...form, unitPriceCAD: v })} type="number" />
            </div>

            {productionOptions.length > 0 && (
              <Select
                label="Link to production batch (optional)"
                value={form.productionEntryId}
                onChange={(v) => setForm({ ...form, productionEntryId: v })}
                options={[{ value: '', label: 'None' }, ...productionOptions]}
              />
            )}

            <Input label="Notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Save</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {sorted.length === 0 && !showForm ? (
        <EmptyState message="Record sales to compare actual revenue against your production estimates." />
      ) : (
        <div className="space-y-2">
          {sorted.map((sale) => {
            const linkedProd = sale.productionEntryId
              ? data.production.find((p) => p.id === sale.productionEntryId)
              : undefined
            const estimatedPrice = linkedProd?.estimatedRetailPriceCAD
            const priceDiff =
              estimatedPrice !== undefined ? sale.unitPriceCAD - estimatedPrice : undefined

            return (
              <Card key={sale.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{sale.productName}</div>
                    <div className="text-xs text-ink-muted">
                      {sale.date} · {sale.quantity} × {formatCAD(sale.unitPriceCAD)}
                    </div>
                    {priceDiff !== undefined && (
                      <div className={`text-xs mt-0.5 ${priceDiff >= 0 ? 'text-matcha-dark' : 'text-sakura-dark'}`}>
                        vs estimate: {priceDiff >= 0 ? '+' : ''}{formatCAD(priceDiff)}/unit
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCAD(sale.quantity * sale.unitPriceCAD)}</div>
                    <button onClick={() => handleDelete(sale.id)} className="text-sakura p-1 mt-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
