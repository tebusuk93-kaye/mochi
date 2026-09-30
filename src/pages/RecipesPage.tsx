import { useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  formatCAD,
  formatCurrency,
  generateId,
  importedUnitCost,
  recipeIngredientCostPerUnit,
} from '../lib/calculations'
import type { Recipe, Currency, ImportedProduct } from '../types'
import { Button, Card, Input, PageHeader, Select, EmptyState, FormError } from '../components/ui'
import {
  IngredientRows,
  emptyIngredientRow,
  parseIngredientRows,
  toFormRows,
  type IngredientFormRow,
} from '../components/IngredientRows'

type RecipeTab = 'mochi' | 'onigiri' | 'imported'

export function RecipesPage() {
  const { data, updateData } = useApp()
  const [tab, setTab] = useState<RecipeTab>('mochi')
  const [showMochiForm, setShowMochiForm] = useState(false)
  const [showOnigiriForm, setShowOnigiriForm] = useState(false)
  const [showImportedForm, setShowImportedForm] = useState(false)

  return (
    <div>
      <PageHeader
        title="Recipes & Products"
        subtitle="Mochi & onigiri recipes, imported rice crackers"
      />

      <div className="flex gap-2 mb-4">
        <Button variant={tab === 'mochi' ? 'primary' : 'secondary'} onClick={() => setTab('mochi')} className="flex-1">
          Mochi
        </Button>
        <Button variant={tab === 'onigiri' ? 'primary' : 'secondary'} onClick={() => setTab('onigiri')} className="flex-1">
          Onigiri
        </Button>
        <Button variant={tab === 'imported' ? 'primary' : 'secondary'} onClick={() => setTab('imported')} className="flex-1">
          Imported
        </Button>
      </div>

      {tab === 'mochi' && (
        <RecipeTab
          productType="mochi"
          showForm={showMochiForm}
          setShowForm={setShowMochiForm}
          data={data}
          updateData={updateData}
        />
      )}
      {tab === 'onigiri' && (
        <RecipeTab
          productType="onigiri"
          showForm={showOnigiriForm}
          setShowForm={setShowOnigiriForm}
          data={data}
          updateData={updateData}
        />
      )}
      {tab === 'imported' && (
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

type RecipeFormState = {
  name: string
  batchYield: string
  baseIngredients: IngredientFormRow[]
  fillingIngredients: IngredientFormRow[]
  individualPackagingId: string
  boxPackagingId: string
  innerPackagingId: string
  notes: string
}

const emptyRecipeForm = (): RecipeFormState => ({
  name: '',
  batchYield: '',
  baseIngredients: [emptyIngredientRow()],
  fillingIngredients: [],
  individualPackagingId: '',
  boxPackagingId: '',
  innerPackagingId: '',
  notes: '',
})

function recipeToForm(recipe: Recipe): RecipeFormState {
  return {
    name: recipe.name,
    batchYield: String(recipe.batchYield),
    baseIngredients: toFormRows(recipe.baseIngredients).length > 0
      ? toFormRows(recipe.baseIngredients)
      : [emptyIngredientRow()],
    fillingIngredients: toFormRows(recipe.fillingIngredients),
    individualPackagingId: recipe.individualPackagingId ?? '',
    boxPackagingId: recipe.boxPackagingId ?? '',
    innerPackagingId: recipe.innerPackagingId ?? '',
    notes: recipe.notes ?? '',
  }
}

function RecipeTab({
  productType,
  showForm,
  setShowForm,
  data,
  updateData,
}: {
  productType: 'mochi' | 'onigiri'
  showForm: boolean
  setShowForm: (v: boolean) => void
  data: ReturnType<typeof useApp>['data']
  updateData: ReturnType<typeof useApp>['updateData']
}) {
  const ingredients = data.supplies.filter((s) => s.category === 'ingredient')
  const individualPkgs = data.supplies.filter((s) => s.category === 'packaging_individual')
  const boxPkgs = data.supplies.filter((s) => s.category === 'packaging_box')
  const innerPkgs = data.supplies.filter((s) => s.category === 'packaging_inner')
  const recipes = data.recipes.filter((r) => r.productType === productType)

  const unitLabel = productType === 'mochi' ? 'mochi' : 'onigiri'
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState<RecipeFormState>(emptyRecipeForm())

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyRecipeForm())
    setError('')
  }

  const startAdd = () => {
    setEditingId(null)
    setForm(emptyRecipeForm())
    setError('')
    setShowForm(true)
  }

  const startEdit = (recipe: Recipe) => {
    setEditingId(recipe.id)
    setForm(recipeToForm(recipe))
    setError('')
    setShowForm(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Please enter a recipe name.')
      return
    }
    const batchYield = parseFloat(form.batchYield)
    if (!form.batchYield || Number.isNaN(batchYield) || batchYield <= 0) {
      setError(`Please enter how many ${unitLabel} one batch makes.`)
      return
    }

    const baseIngredients = parseIngredientRows(form.baseIngredients)
    const fillingIngredients = parseIngredientRows(form.fillingIngredients)

    if (baseIngredients.length === 0 && fillingIngredients.length === 0) {
      setError('Add at least one ingredient.')
      return
    }

    const recipe: Recipe = {
      id: editingId ?? generateId(),
      name: form.name.trim(),
      productType,
      batchYield,
      baseIngredients,
      fillingIngredients,
      individualPackagingId: form.individualPackagingId || undefined,
      boxPackagingId: form.boxPackagingId || undefined,
      innerPackagingId: form.innerPackagingId || undefined,
      notes: form.notes || undefined,
    }

    updateData((prev) => ({
      ...prev,
      recipes: editingId
        ? prev.recipes.map((r) => (r.id === editingId ? recipe : r))
        : [...prev.recipes, recipe],
    }))
    closeForm()
  }

  const handleDelete = (id: string) => {
    updateData((prev) => ({ ...prev, recipes: prev.recipes.filter((r) => r.id !== id) }))
    if (editingId === id) closeForm()
  }

  const pkgIndividualOpts = [{ value: '', label: 'None' }, ...individualPkgs.map((s) => ({ value: s.id, label: s.name }))]
  const pkgBoxOpts = [{ value: '', label: 'None' }, ...boxPkgs.map((s) => ({ value: s.id, label: s.name }))]
  const pkgInnerOpts = [{ value: '', label: 'None' }, ...innerPkgs.map((s) => ({ value: s.id, label: s.name }))]

  return (
    <>
      <Button onClick={() => (showForm ? closeForm() : startAdd())} className="w-full mb-4 flex items-center justify-center gap-2">
        <Plus size={18} />
        Add {productType === 'mochi' ? 'Mochi' : 'Onigiri'} Recipe
      </Button>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="text-sm font-medium text-ink">{editingId ? 'Edit recipe' : 'New recipe'}</div>
            {error && <FormError message={error} />}
            <Input
              label="Recipe name"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder={productType === 'mochi' ? 'e.g. Peach mochi' : 'e.g. Salmon onigiri'}
            />
            <Input
              label={`Batch yield (${unitLabel} per batch)`}
              value={form.batchYield}
              onChange={(v) => setForm({ ...form, batchYield: v })}
              type="number"
              step="any"
              min="1"
              inputMode="decimal"
              hint={`e.g. one batch makes 8 ${unitLabel}`}
            />

            <IngredientRows
              title="Base ingredients"
              hint="Flour, rice, sugar, etc. — per batch or per unit"
              rows={form.baseIngredients}
              supplies={ingredients}
              productType={productType}
              onChange={(rows) => setForm({ ...form, baseIngredients: rows })}
              defaultBasis="per_batch"
            />

            <div className="border-t border-border pt-3">
              <IngredientRows
                title="Filling / topping (optional)"
                hint="Fruits, bean paste, etc. Use 個 for whole pieces — e.g. 0.25 per mochi = ¼ peach"
                rows={form.fillingIngredients.length > 0 ? form.fillingIngredients : [emptyIngredientRow()]}
                supplies={ingredients}
                productType={productType}
                onChange={(rows) => setForm({ ...form, fillingIngredients: rows })}
                defaultBasis="per_unit"
              />
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <div className="text-sm font-medium text-ink-muted">Packaging supplies</div>
              <Select label="Individual wrapper" value={form.individualPackagingId} onChange={(v) => setForm({ ...form, individualPackagingId: v })} options={pkgIndividualOpts} />
              <Select label="Box (4-pack)" value={form.boxPackagingId} onChange={(v) => setForm({ ...form, boxPackagingId: v })} options={pkgBoxOpts} />
              <Select label="Inner wrapper (×4 per box)" value={form.innerPackagingId} onChange={(v) => setForm({ ...form, innerPackagingId: v })} options={pkgInnerOpts} />
            </div>

            <Input label="Notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{editingId ? 'Update' : 'Save Recipe'}</Button>
              <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {recipes.length === 0 && !showForm ? (
        <EmptyState message={`Define a ${productType} recipe with batch yield and ingredients.`} />
      ) : (
        <div className="space-y-2">
          {recipes.map((r) => {
            const costPerUnit = recipeIngredientCostPerUnit(r, data.supplies, data.settings.jpyToCad)
            return (
              <Card key={r.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-ink-muted">
                      Batch makes {r.batchYield} · {r.baseIngredients.length} base + {r.fillingIngredients.length} filling
                    </div>
                    <div className="text-xs text-matcha-dark mt-0.5">
                      Ingredient cost: {formatCAD(costPerUnit)}/{unitLabel}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(r)} className="text-ink-muted p-1" aria-label="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-sakura p-1" aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    unitCost: '',
    costCurrency: 'JPY' as Currency,
    estimatedRetailPriceCAD: '',
    notes: '',
  })

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', unitCost: '', costCurrency: 'JPY', estimatedRetailPriceCAD: '', notes: '' })
    setError('')
  }

  const startAdd = () => {
    setEditingId(null)
    setForm({ name: '', unitCost: '', costCurrency: 'JPY', estimatedRetailPriceCAD: '', notes: '' })
    setError('')
    setShowForm(true)
  }

  const startEdit = (product: ImportedProduct) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      unitCost: String(product.unitCost),
      costCurrency: product.costCurrency,
      estimatedRetailPriceCAD: String(product.estimatedRetailPriceCAD),
      notes: product.notes ?? '',
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Please enter a product name.')
      return
    }
    const unitCost = parseFloat(form.unitCost)
    const retail = parseFloat(form.estimatedRetailPriceCAD)
    if (!form.unitCost || Number.isNaN(unitCost)) {
      setError('Please enter import cost per unit.')
      return
    }
    if (!form.estimatedRetailPriceCAD || Number.isNaN(retail)) {
      setError('Please enter estimated retail price.')
      return
    }

    const product: ImportedProduct = {
      id: editingId ?? generateId(),
      name: form.name.trim(),
      productType: 'rice_cracker',
      unitCost,
      costCurrency: form.costCurrency,
      estimatedRetailPriceCAD: retail,
      notes: form.notes || undefined,
    }

    updateData((prev) => ({
      ...prev,
      importedProducts: editingId
        ? prev.importedProducts.map((p) => (p.id === editingId ? product : p))
        : [...prev.importedProducts, product],
    }))
    closeForm()
  }

  const handleDelete = (id: string) => {
    updateData((prev) => ({
      ...prev,
      importedProducts: prev.importedProducts.filter((p) => p.id !== id),
    }))
    if (editingId === id) closeForm()
  }

  return (
    <>
      <Button onClick={() => (showForm ? closeForm() : startAdd())} className="w-full mb-4 flex items-center justify-center gap-2">
        <Plus size={18} />
        Add Rice Cracker
      </Button>

      {showForm && (
        <Card className="mb-4">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="text-sm font-medium text-ink">{editingId ? 'Edit product' : 'New product'}</div>
            {error && <FormError message={error} />}
            <Input label="Product name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Senbei assortment" />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Import cost per unit" value={form.unitCost} onChange={(v) => setForm({ ...form, unitCost: v })} type="number" step="any" min="0" inputMode="decimal" />
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
              step="any"
              min="0"
              inputMode="decimal"
            />
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">{editingId ? 'Update' : 'Save'}</Button>
              <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {data.importedProducts.length === 0 && !showForm ? (
        <EmptyState message="Add rice crackers you import from Japan. Onigiri is made in-house — use the Onigiri tab." />
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
                      Rice cracker · Cost: {formatCurrency(p.unitCost, p.costCurrency)} ({formatCAD(costCAD)})
                    </div>
                    <div className="text-xs text-matcha-dark mt-0.5">
                      Retail {formatCAD(p.estimatedRetailPriceCAD)} · Margin {formatCAD(margin)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(p)} className="text-ink-muted p-1" aria-label="Edit">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="text-sakura p-1" aria-label="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
