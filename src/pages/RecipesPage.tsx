import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  formatCAD,
  formatCurrency,
  generateId,
  importedUnitCost,
  recipeIngredientCostPerUnit,
} from '../lib/calculations'
import type { Recipe, RecipeIngredient, ImportedProduct, Currency } from '../types'
import { Button, Card, Input, PageHeader, Select, EmptyState } from '../components/ui'

export function RecipesPage() {
  const { data, updateData } = useApp()
  const [tab, setTab] = useState<'mochi' | 'imported'>('mochi')
  const [showMochiForm, setShowMochiForm] = useState(false)
  const [showImportedForm, setShowImportedForm] = useState(false)

  return (
    <div>
      <PageHeader
        title="Recipes & Products"
        subtitle="Mochi batch recipes & imported items"
      />

      <div className="flex gap-2 mb-4">
        <Button
          variant={tab === 'mochi' ? 'primary' : 'secondary'}
          onClick={() => setTab('mochi')}
          className="flex-1"
        >
          Mochi
        </Button>
        <Button
          variant={tab === 'imported' ? 'primary' : 'secondary'}
          onClick={() => setTab('imported')}
          className="flex-1"
        >
          Imported
        </Button>
      </div>

      {tab === 'mochi' ? (
        <MochiTab
          showForm={showMochiForm}
          setShowForm={setShowMochiForm}
          data={data}
          updateData={updateData}
        />
      ) : (
        <ImportedTab
          showForm={showImportedForm}
          setShowForm={setShowImportedForm}
          data={data}
          updateData={updateData}
        />
      )}
    </div>
  )
}

function MochiTab({
  showForm,
  setShowForm,
  data,
  updateData,
}: {
  showForm: boolean
  setShowForm: (v: boolean) => void
  data: ReturnType<typeof useApp>['data']
  updateData: ReturnType<typeof useApp>['updateData']
}) {
  const ingredients = data.supplies.filter((s) => s.category === 'ingredient')
  const individualPkgs = data.supplies.filter((s) => s.category === 'packaging_individual')
  const boxPkgs = data.supplies.filter((s) => s.category === 'packaging_box')
  const innerPkgs = data.supplies.filter((s) => s.category === 'packaging_inner')

  const [form, setForm] = useState({
    name: '',
    batchYield: '',
    baseIngredients: [{ supplyId: '', amount: '' }] as { supplyId: string; amount: string }[],
    fillingSupplyId: '',
    fillingAmount: '',
    individualPackagingId: '',
    boxPackagingId: '',
    innerPackagingId: '',
    notes: '',
  })

  const addBaseIngredient = () => {
    setForm({ ...form, baseIngredients: [...form.baseIngredients, { supplyId: '', amount: '' }] })
  }

  const removeBaseIngredient = (idx: number) => {
    setForm({ ...form, baseIngredients: form.baseIngredients.filter((_, i) => i !== idx) })
  }

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.batchYield) return

    const baseIngredients: RecipeIngredient[] = form.baseIngredients
      .filter((i) => i.supplyId && i.amount)
      .map((i) => ({ supplyId: i.supplyId, amount: parseFloat(i.amount) }))

    const recipe: Recipe = {
      id: generateId(),
      name: form.name,
      productType: 'mochi',
      batchYield: parseFloat(form.batchYield),
      baseIngredients,
      fillingIngredient:
        form.fillingSupplyId && form.fillingAmount
          ? { supplyId: form.fillingSupplyId, amount: parseFloat(form.fillingAmount) }
          : undefined,
      individualPackagingId: form.individualPackagingId || undefined,
      boxPackagingId: form.boxPackagingId || undefined,
      innerPackagingId: form.innerPackagingId || undefined,
      notes: form.notes || undefined,
    }

    updateData((prev) => ({ ...prev, recipes: [...prev.recipes, recipe] }))
    setForm({
      name: '',
      batchYield: '',
      baseIngredients: [{ supplyId: '', amount: '' }],
      fillingSupplyId: '',
      fillingAmount: '',
      individualPackagingId: '',
      boxPackagingId: '',
      innerPackagingId: '',
      notes: '',
    })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    updateData((prev) => ({ ...prev, recipes: prev.recipes.filter((r) => r.id !== id) }))
  }

  const supplyOptions = ingredients.map((s) => ({ value: s.id, label: s.name }))
  const pkgIndividualOpts = [{ value: '', label: 'None' }, ...individualPkgs.map((s) => ({ value: s.id, label: s.name }))]
  const pkgBoxOpts = [{ value: '', label: 'None' }, ...boxPkgs.map((s) => ({ value: s.id, label: s.name }))]
  const pkgInnerOpts = [{ value: '', label: 'None' }, ...innerPkgs.map((s) => ({ value: s.id, label: s.name }))]

  return (
    <>
      <Button onClick={() => setShowForm(!showForm)} className="w-full mb-4 flex items-center justify-center gap-2">
        <Plus size={18} />
        Add Mochi Recipe
      </Button>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <Input label="Flavor name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Red bean" />
            <Input
              label="Batch yield (mochi per batch)"
              value={form.batchYield}
              onChange={(v) => setForm({ ...form, batchYield: v })}
              type="number"
              hint="e.g. 200g flour + other ingredients makes 8 mochi → enter 8"
            />

            <div>
              <div className="text-sm font-medium text-ink-muted mb-2">Base ingredients (per batch)</div>
              {form.baseIngredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-end">
                  <div className="flex-1">
                    <Select
                      label=""
                      value={ing.supplyId}
                      onChange={(v) => {
                        const updated = [...form.baseIngredients]
                        updated[idx] = { ...updated[idx], supplyId: v }
                        setForm({ ...form, baseIngredients: updated })
                      }}
                      options={[{ value: '', label: 'Select...' }, ...supplyOptions]}
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      label=""
                      value={ing.amount}
                      onChange={(v) => {
                        const updated = [...form.baseIngredients]
                        updated[idx] = { ...updated[idx], amount: v }
                        setForm({ ...form, baseIngredients: updated })
                      }}
                      type="number"
                      placeholder="g"
                    />
                  </div>
                  {form.baseIngredients.length > 1 && (
                    <button type="button" onClick={() => removeBaseIngredient(idx)} className="text-sakura pb-2">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <Button type="button" variant="ghost" onClick={addBaseIngredient} className="text-xs">
                + Add ingredient
              </Button>
            </div>

            <div className="border-t border-border pt-3">
              <div className="text-sm font-medium text-ink-muted mb-2">Filling (per batch, optional)</div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    label=""
                    value={form.fillingSupplyId}
                    onChange={(v) => setForm({ ...form, fillingSupplyId: v })}
                    options={[{ value: '', label: 'None' }, ...supplyOptions]}
                  />
                </div>
                <div className="w-24">
                  <Input label="" value={form.fillingAmount} onChange={(v) => setForm({ ...form, fillingAmount: v })} type="number" placeholder="g" />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <div className="text-sm font-medium text-ink-muted">Packaging supplies</div>
              <Select label="Individual wrapper" value={form.individualPackagingId} onChange={(v) => setForm({ ...form, individualPackagingId: v })} options={pkgIndividualOpts} />
              <Select label="Box (4-pack)" value={form.boxPackagingId} onChange={(v) => setForm({ ...form, boxPackagingId: v })} options={pkgBoxOpts} />
              <Select label="Inner wrapper (×4 per box)" value={form.innerPackagingId} onChange={(v) => setForm({ ...form, innerPackagingId: v })} options={pkgInnerOpts} />
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Save Recipe</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {data.recipes.length === 0 && !showForm ? (
        <EmptyState message="Define a mochi recipe with batch yield. Example: 200g flour + 50g sugar + filling → 8 mochi." />
      ) : (
        <div className="space-y-2">
          {data.recipes.map((r) => {
            const costPerUnit = recipeIngredientCostPerUnit(r, data.supplies, data.settings.jpyToCad)
            return (
              <Card key={r.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-ink-muted">
                      Batch makes {r.batchYield} mochi · {r.baseIngredients.length} base + {r.fillingIngredient ? 'filling' : 'no filling'}
                    </div>
                    <div className="text-xs text-matcha-dark mt-0.5">
                      Ingredient cost: {formatCAD(costPerUnit)}/mochi
                    </div>
                  </div>
                  <button onClick={() => handleDelete(r.id)} className="text-sakura p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

function ImportedTab({
  showForm,
  setShowForm,
  data,
  updateData,
}: {
  showForm: boolean
  setShowForm: (v: boolean) => void
  data: ReturnType<typeof useApp>['data']
  updateData: ReturnType<typeof useApp>['updateData']
}) {
  const [form, setForm] = useState({
    name: '',
    productType: 'onigiri' as 'onigiri' | 'rice_cracker',
    unitCost: '',
    costCurrency: 'JPY' as Currency,
    estimatedRetailPriceCAD: '',
    notes: '',
  })

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.unitCost || !form.estimatedRetailPriceCAD) return

    const product: ImportedProduct = {
      id: generateId(),
      name: form.name,
      productType: form.productType,
      unitCost: parseFloat(form.unitCost),
      costCurrency: form.costCurrency,
      estimatedRetailPriceCAD: parseFloat(form.estimatedRetailPriceCAD),
      notes: form.notes || undefined,
    }

    updateData((prev) => ({ ...prev, importedProducts: [...prev.importedProducts, product] }))
    setForm({ name: '', productType: 'onigiri', unitCost: '', costCurrency: 'JPY', estimatedRetailPriceCAD: '', notes: '' })
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      importedProducts: prev.importedProducts.filter((p) => p.id !== id),
    }))
  }

  return (
    <>
      <Button onClick={() => setShowForm(!showForm)} className="w-full mb-4 flex items-center justify-center gap-2">
        <Plus size={18} />
        Add Imported Product
      </Button>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleAdd} className="space-y-3">
            <Input label="Product name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Salmon onigiri" />
            <Select
              label="Type"
              value={form.productType}
              onChange={(v) => setForm({ ...form, productType: v as 'onigiri' | 'rice_cracker' })}
              options={[
                { value: 'onigiri', label: 'Onigiri' },
                { value: 'rice_cracker', label: 'Rice cracker' },
              ]}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Import cost per unit" value={form.unitCost} onChange={(v) => setForm({ ...form, unitCost: v })} type="number" />
              <Select
                label="Cost currency"
                value={form.costCurrency}
                onChange={(v) => setForm({ ...form, costCurrency: v as Currency })}
                options={[
                  { value: 'JPY', label: 'JPY' },
                  { value: 'CAD', label: 'CAD' },
                ]}
              />
            </div>
            <Input
              label="Estimated retail price (CAD)"
              value={form.estimatedRetailPriceCAD}
              onChange={(v) => setForm({ ...form, estimatedRetailPriceCAD: v })}
              type="number"
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Save</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {data.importedProducts.length === 0 && !showForm ? (
        <EmptyState message="Add onigiri or rice crackers you import from Japan." />
      ) : (
        <div className="space-y-2">
          {data.importedProducts.map((p) => {
            const costCAD = importedUnitCost(p, data.settings.jpyToCad)
            const margin = p.estimatedRetailPriceCAD - costCAD
            return (
              <Card key={p.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-ink-muted">
                      {p.productType === 'onigiri' ? 'Onigiri' : 'Rice cracker'} · Cost: {formatCurrency(p.unitCost, p.costCurrency)} ({formatCAD(costCAD)})
                    </div>
                    <div className="text-xs text-matcha-dark mt-0.5">
                      Retail {formatCAD(p.estimatedRetailPriceCAD)} · Margin {formatCAD(margin)}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(p.id)} className="text-sakura p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
