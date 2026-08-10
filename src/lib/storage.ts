import type { AmountBasis, AppData, Recipe, RecipeIngredient } from '../types'

const STORAGE_KEY = 'mochi-production-data'

export const defaultData: AppData = {
  settings: { jpyToCad: 0.0092 },
  supplies: [],
  fixedAssets: [],
  recipes: [],
  importedProducts: [],
  production: [],
  sales: [],
}

type LegacyRecipe = Recipe & {
  fillingIngredient?: RecipeIngredient
  fillingIngredients?: RecipeIngredient[]
}

function migrateIngredient(ing: RecipeIngredient & { amountBasis?: AmountBasis }): RecipeIngredient {
  return {
    supplyId: ing.supplyId,
    amount: ing.amount,
    amountBasis: ing.amountBasis ?? 'per_batch',
  }
}

function migrateRecipe(recipe: LegacyRecipe): Recipe {
  const fillingIngredients =
    recipe.fillingIngredients?.map(migrateIngredient) ??
    (recipe.fillingIngredient ? [migrateIngredient(recipe.fillingIngredient)] : [])

  return {
    id: recipe.id,
    name: recipe.name,
    productType: recipe.productType ?? 'mochi',
    batchYield: recipe.batchYield,
    baseIngredients: (recipe.baseIngredients ?? []).map(migrateIngredient),
    fillingIngredients,
    individualPackagingId: recipe.individualPackagingId,
    boxPackagingId: recipe.boxPackagingId,
    innerPackagingId: recipe.innerPackagingId,
    notes: recipe.notes,
  }
}

function migrateData(parsed: Partial<AppData>): AppData {
  return {
    ...defaultData,
    ...parsed,
    recipes: (parsed.recipes ?? []).map((r) => migrateRecipe(r as LegacyRecipe)),
    importedProducts: (parsed.importedProducts ?? []).filter((p) => p.productType === 'rice_cracker'),
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultData }
    const parsed = JSON.parse(raw) as Partial<AppData>
    return migrateData(parsed)
  } catch {
    return { ...defaultData }
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
