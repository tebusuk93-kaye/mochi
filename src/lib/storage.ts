import type { AmountBasis, AppData, ProductionEntry, Recipe, RecipeIngredient } from '../types'

const STORAGE_KEY = 'mochi-production-data'

export const defaultData: AppData = {
  settings: { jpyToCad: 0.0092, defaultHourlyWageCAD: 18 },
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

type LegacyProductionEntry = ProductionEntry & {
  laborCostCAD?: number
  hourlyWageCAD?: number
  laborHours?: number
  laborPeople?: number
}

function migrateProductionEntry(entry: LegacyProductionEntry): ProductionEntry {
  const hasWageFields =
    (entry.laborHours ?? 0) > 0 ||
    (entry.laborPeople ?? 0) > 0 ||
    (entry.hourlyWageCAD ?? 0) > 0

  if (hasWageFields) {
    return {
      ...entry,
      hourlyWageCAD: entry.hourlyWageCAD ?? 0,
      laborHours: entry.laborHours ?? 0,
      laborPeople: entry.laborPeople ?? 0,
    }
  }

  return {
    ...entry,
    hourlyWageCAD: entry.hourlyWageCAD ?? 0,
    laborHours: 0,
    laborPeople: 0,
    laborCostCAD: entry.laborCostCAD ?? 0,
  }
}

function migrateData(parsed: Partial<AppData>): AppData {
  const settings = {
    ...defaultData.settings,
    ...parsed.settings,
    defaultHourlyWageCAD: parsed.settings?.defaultHourlyWageCAD ?? defaultData.settings.defaultHourlyWageCAD,
  }

  return {
    ...defaultData,
    ...parsed,
    settings,
    recipes: (parsed.recipes ?? []).map((r) => migrateRecipe(r as LegacyRecipe)),
    importedProducts: (parsed.importedProducts ?? []).filter((p) => p.productType === 'rice_cracker'),
    production: (parsed.production ?? []).map((e) => migrateProductionEntry(e as LegacyProductionEntry)),
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
