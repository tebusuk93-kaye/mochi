import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  calculateProfitEstimate,
  formatCAD,
  generateId,
} from '../lib/calculations'
import type { PackagingType, ProductType } from '../types'
import { Button, Card, Input, PageHeader, Select, EmptyState } from '../components/ui'

export function ProductionPage() {
  const { data, updateData } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    productCategory: 'mochi' as 'mochi' | 'imported',
    recipeId: '',
    importedProductId: '',
    quantity: '',
    packagingType: 'individual' as PackagingType,
    laborCostCAD: '',
    utilitiesCostCAD: '',
    marketingCostCAD: '',
    estimatedRetailPriceCAD: '',
    notes: '',
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.quantity || !form.estimatedRetailPriceCAD) return

    let productName = ''
    let productType: ProductType = 'mochi'
    let recipeId: string | undefined
    let importedProductId: string | undefined

    if (form.productCategory === 'mochi') {
      const recipe = data.recipes.find((r) => r.id === form.recipeId)
      if (!recipe) return
      productName = recipe.name
      productType = 'mochi'
      recipeId = recipe.id
    } else {
      const product = data.importedProducts.find((p) => p.id === form.importedProductId)
      if (!product) return
      productName = product.name
      productType = product.productType
      importedProductId = product.id
    }

    const entry = {
      id: generateId(),
      date: form.date,
      productType,
      recipeId,
      importedProductId,
      productName,
      quantity: parseFloat(form.quantity),
      packagingType: form.packagingType,
      laborCostCAD: parseFloat(form.laborCostCAD) || 0,
      utilitiesCostCAD: parseFloat(form.utilitiesCostCAD) || 0,
      marketingCostCAD: parseFloat(form.marketingCostCAD) || 0,
      estimatedRetailPriceCAD: parseFloat(form.estimatedRetailPriceCAD),
      notes: form.notes || undefined,
    }

    updateData((prev) => ({ ...prev, production: [...prev.production, entry] }))
    setForm({
      date: new Date().toISOString().slice(0, 10),
      productCategory: 'mochi',
      recipeId: '',
      importedProductId: '',
      quantity: '',
      packagingType: 'individual',
      laborCostCAD: '',
      utilitiesCostCAD: '',
      marketingCostCAD: '',
      estimatedRetailPriceCAD: '',
      notes: '',
    })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      production: prev.production.filter((p) => p.id !== id),
    }))
  }

  const recipeOptions = data.recipes.map((r) => ({ value: r.id, label: r.name }))
  const importedOptions = data.importedProducts.map((p) => ({
    value: p.id,
    label: `${p.name} (${p.productType === 'onigiri' ? 'Onigiri' : 'Rice cracker'})`,
  }))

  const sorted = [...data.production].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div>
      <PageHeader
        title="Production Log"
        subtitle="Enter how many you made & estimated retail price"
      />

      <Button onClick={() => setShowForm(!showForm)} className="w-full mb-4 flex items-center justify-center gap-2">
        <Plus size={18} />
        Log Production
      </Button>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <Input label="Date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} type="date" />

            <Select
              label="Product type"
              value={form.productCategory}
              onChange={(v) => setForm({ ...form, productCategory: v as 'mochi' | 'imported', recipeId: '', importedProductId: '' })}
              options={[
                { value: 'mochi', label: 'Mochi (in-house)' },
                { value: 'imported', label: 'Onigiri / Rice cracker' },
              ]}
            />

            {form.productCategory === 'mochi' ? (
              <>
                <Select
                  label="Recipe / flavor"
                  value={form.recipeId}
                  onChange={(v) => setForm({ ...form, recipeId: v })}
                  options={[{ value: '', label: 'Select recipe...' }, ...recipeOptions]}
                />
                <Select
                  label="Packaging"
                  value={form.packagingType}
                  onChange={(v) => setForm({ ...form, packagingType: v as PackagingType })}
                  options={[
                    { value: 'individual', label: 'Individual wrapper' },
                    { value: 'box_of_4', label: 'Box of 4' },
                  ]}
                />
              </>
            ) : (
              <Select
                label="Product"
                value={form.importedProductId}
                onChange={(v) => {
                  const product = data.importedProducts.find((p) => p.id === v)
                  setForm({
                    ...form,
                    importedProductId: v,
                    estimatedRetailPriceCAD: product ? String(product.estimatedRetailPriceCAD) : '',
                  })
                }}
                options={[{ value: '', label: 'Select product...' }, ...importedOptions]}
              />
            )}

            <Input
              label="Quantity made"
              value={form.quantity}
              onChange={(v) => setForm({ ...form, quantity: v })}
              type="number"
              hint="Enter the number of mochi/units you produced"
            />

            <Input
              label="Estimated retail price per unit (CAD)"
              value={form.estimatedRetailPriceCAD}
              onChange={(v) => setForm({ ...form, estimatedRetailPriceCAD: v })}
              type="number"
            />

            <div className="border-t border-border pt-3">
              <div className="text-sm font-medium text-ink-muted mb-2">Batch costs (total for this run)</div>
              <Input label="Labor (CAD)" value={form.laborCostCAD} onChange={(v) => setForm({ ...form, laborCostCAD: v })} type="number" placeholder="0" />
              <div className="h-2" />
              <Input label="Utilities (CAD)" value={form.utilitiesCostCAD} onChange={(v) => setForm({ ...form, utilitiesCostCAD: v })} type="number" placeholder="0" />
              <div className="h-2" />
              <Input label="Marketing (CAD)" value={form.marketingCostCAD} onChange={(v) => setForm({ ...form, marketingCostCAD: v })} type="number" placeholder="0" />
            </div>

            <Input label="Notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Save</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {sorted.length === 0 && !showForm ? (
        <EmptyState message="Log a production run — enter quantity made and the app calculates cost per unit from your recipes." />
      ) : (
        <div className="space-y-3">
          {sorted.map((entry) => {
            const est = calculateProfitEstimate(entry, data)
            return (
              <Card key={entry.id}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{entry.productName}</div>
                    <div className="text-xs text-ink-muted">
                      {entry.date} · {entry.quantity} units
                      {entry.productType === 'mochi' && (
                        <> · {entry.packagingType === 'individual' ? 'Individual' : 'Box of 4'}</>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(entry.id)} className="text-sakura p-1">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <CostCell label="Cost/unit (w/ dep.)" value={formatCAD(est.costPerUnit.total)} />
                  <CostCell label="Cost/unit (no dep.)" value={formatCAD(est.costPerUnit.totalWithoutDepreciation)} />
                  <CostCell label="Profit/unit (w/ dep.)" value={formatCAD(est.profitPerUnit)} positive={est.profitPerUnit >= 0} />
                  <CostCell label="Profit/unit (no dep.)" value={formatCAD(est.profitPerUnitWithoutDepreciation)} positive={est.profitPerUnitWithoutDepreciation >= 0} />
                  <CostCell label="Profit/batch (w/ dep.)" value={formatCAD(est.profitPerBatch)} positive={est.profitPerBatch >= 0} />
                  <CostCell label="Retail price" value={formatCAD(est.revenuePerUnit)} />
                </div>

                <details className="mt-2">
                  <summary className="text-xs text-ink-muted cursor-pointer">Cost breakdown</summary>
                  <div className="mt-2 space-y-1 text-xs">
                    <BreakdownRow label="Ingredients" value={est.costPerUnit.ingredients} />
                    <BreakdownRow label="Packaging" value={est.costPerUnit.packaging} />
                    <BreakdownRow label="Labor" value={est.costPerUnit.labor} />
                    <BreakdownRow label="Utilities" value={est.costPerUnit.utilities} />
                    <BreakdownRow label="Marketing" value={est.costPerUnit.marketing} />
                    <BreakdownRow label="Depreciation" value={est.costPerUnit.depreciation} />
                  </div>
                </details>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CostCell({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-cream rounded-lg p-2">
      <div className="text-ink-muted">{label}</div>
      <div className={`font-medium ${positive === true ? 'text-matcha-dark' : positive === false ? 'text-sakura-dark' : ''}`}>
        {value}
      </div>
    </div>
  )
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span>{formatCAD(value)}</span>
    </div>
  )
}
