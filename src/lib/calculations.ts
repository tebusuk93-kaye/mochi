import type {
  AmountBasis,
  AppData,
  Currency,
  FixedAsset,
  ImportedProduct,
  PackagingType,
  ProductionEntry,
  ProfitEstimate,
  Recipe,
  RecipeIngredient,
  SaleEntry,
  Supply,
  Unit,
  UnitCostBreakdown,
} from '../types'

export function toCAD(amount: number, currency: Currency, jpyToCad: number): number {
  return currency === 'CAD' ? amount : amount * jpyToCad
}

export function formatUnit(unit: Unit): string {
  if (unit === 'piece') return '個'
  return unit
}

export function supplyUnitCost(supply: Supply, jpyToCad: number): number {
  if (supply.packageSize <= 0) return 0
  return toCAD(supply.packageCost / supply.packageSize, supply.currency, jpyToCad)
}

export function assetDepreciationPerUnit(asset: FixedAsset, jpyToCad: number): number {
  if (asset.expectedTotalUnits <= 0) return 0
  return toCAD(asset.totalCost / asset.expectedTotalUnits, asset.currency, jpyToCad)
}

export function totalDepreciationPerUnit(assets: FixedAsset[], jpyToCad: number): number {
  return assets.reduce((sum, a) => sum + assetDepreciationPerUnit(a, jpyToCad), 0)
}

export function amountPerBatch(ingredient: RecipeIngredient, batchYield: number): number {
  return ingredient.amountBasis === 'per_unit'
    ? ingredient.amount * batchYield
    : ingredient.amount
}

export function recipeIngredientCost(
  ingredients: RecipeIngredient[],
  supplies: Supply[],
  batchYield: number,
  jpyToCad: number,
): number {
  return ingredients.reduce((sum, ing) => {
    const supply = supplies.find((s) => s.id === ing.supplyId)
    if (!supply) return sum
    return sum + supplyUnitCost(supply, jpyToCad) * amountPerBatch(ing, batchYield)
  }, 0)
}

export function recipeBatchCost(recipe: Recipe, supplies: Supply[], jpyToCad: number): number {
  const base = recipeIngredientCost(recipe.baseIngredients, supplies, recipe.batchYield, jpyToCad)
  const filling = recipeIngredientCost(recipe.fillingIngredients, supplies, recipe.batchYield, jpyToCad)
  return base + filling
}

export function recipeIngredientCostPerUnit(
  recipe: Recipe,
  supplies: Supply[],
  jpyToCad: number,
): number {
  if (recipe.batchYield <= 0) return 0
  return recipeBatchCost(recipe, supplies, jpyToCad) / recipe.batchYield
}

export function packagingCostPerUnit(
  packagingType: PackagingType,
  recipe: Recipe | undefined,
  supplies: Supply[],
  jpyToCad: number,
): number {
  if (!recipe) return 0

  if (packagingType === 'individual') {
    if (!recipe.individualPackagingId) return 0
    const supply = supplies.find((s) => s.id === recipe.individualPackagingId)
    return supply ? supplyUnitCost(supply, jpyToCad) : 0
  }

  let boxCost = 0
  let innerCost = 0
  if (recipe.boxPackagingId) {
    const box = supplies.find((s) => s.id === recipe.boxPackagingId)
    boxCost = box ? supplyUnitCost(box, jpyToCad) : 0
  }
  if (recipe.innerPackagingId) {
    const inner = supplies.find((s) => s.id === recipe.innerPackagingId)
    innerCost = inner ? supplyUnitCost(inner, jpyToCad) * 4 : 0
  }
  return (boxCost + innerCost) / 4
}

export function importedUnitCost(product: ImportedProduct, jpyToCad: number): number {
  return toCAD(product.unitCost, product.costCurrency, jpyToCad)
}

export function computeLaborCostCAD(
  entry: Pick<ProductionEntry, 'hourlyWageCAD' | 'laborHours' | 'laborPeople' | 'laborCostCAD'>,
  defaultHourlyWageCAD: number,
): number {
  const hasWageInput = entry.laborHours > 0 && entry.laborPeople > 0
  if (hasWageInput) {
    const wage = entry.hourlyWageCAD > 0 ? entry.hourlyWageCAD : defaultHourlyWageCAD
    return wage * entry.laborHours * entry.laborPeople
  }
  return entry.laborCostCAD ?? 0
}

export function calculateProductionCosts(
  entry: ProductionEntry,
  data: AppData,
): UnitCostBreakdown {
  const { settings, supplies, fixedAssets, recipes, importedProducts } = data
  const jpyToCad = settings.jpyToCad
  const qty = entry.quantity
  if (qty <= 0) {
    return emptyBreakdown()
  }

  let ingredients = 0
  let packaging = 0

  if ((entry.productType === 'mochi' || entry.productType === 'onigiri') && entry.recipeId) {
    const recipe = recipes.find((r) => r.id === entry.recipeId)
    if (recipe) {
      ingredients = recipeIngredientCostPerUnit(recipe, supplies, jpyToCad)
      packaging = packagingCostPerUnit(entry.packagingType, recipe, supplies, jpyToCad)
    }
  } else if (entry.importedProductId) {
    const product = importedProducts.find((p) => p.id === entry.importedProductId)
    if (product) {
      ingredients = importedUnitCost(product, jpyToCad)
    }
  }

  const labor = computeLaborCostCAD(entry, settings.defaultHourlyWageCAD) / qty
  const utilities = entry.utilitiesCostCAD / qty
  const marketing = entry.marketingCostCAD / qty
  const depreciation = totalDepreciationPerUnit(fixedAssets, jpyToCad)

  const totalWithoutDepreciation = ingredients + packaging + labor + utilities + marketing
  const total = totalWithoutDepreciation + depreciation

  return {
    ingredients,
    packaging,
    labor,
    utilities,
    marketing,
    depreciation,
    total,
    totalWithoutDepreciation,
  }
}

export function calculateProfitEstimate(
  entry: ProductionEntry,
  data: AppData,
): ProfitEstimate {
  const costPerUnit = calculateProductionCosts(entry, data)
  const revenuePerUnit = entry.estimatedRetailPriceCAD
  const revenuePerBatch = revenuePerUnit * entry.quantity
  const profitPerUnit = revenuePerUnit - costPerUnit.total
  const profitPerUnitWithoutDepreciation = revenuePerUnit - costPerUnit.totalWithoutDepreciation
  const profitPerBatch = profitPerUnit * entry.quantity
  const profitPerBatchWithoutDepreciation = profitPerUnitWithoutDepreciation * entry.quantity

  return {
    costPerUnit,
    profitPerUnit,
    profitPerUnitWithoutDepreciation,
    profitPerBatch,
    profitPerBatchWithoutDepreciation,
    revenuePerUnit,
    revenuePerBatch,
  }
}

export function aggregateSales(sales: SaleEntry[]) {
  const totalRevenue = sales.reduce((s, sale) => s + sale.quantity * sale.unitPriceCAD, 0)
  const totalUnits = sales.reduce((s, sale) => s + sale.quantity, 0)
  return { totalRevenue, totalUnits }
}

export function aggregateProduction(data: AppData) {
  let estimatedRevenue = 0
  let estimatedCost = 0
  let estimatedCostNoDep = 0
  let totalUnits = 0

  for (const entry of data.production) {
    const est = calculateProfitEstimate(entry, data)
    estimatedRevenue += est.revenuePerBatch
    estimatedCost += est.costPerUnit.total * entry.quantity
    estimatedCostNoDep += est.costPerUnit.totalWithoutDepreciation * entry.quantity
    totalUnits += entry.quantity
  }

  return {
    estimatedRevenue,
    estimatedCost,
    estimatedCostNoDep,
    estimatedProfit: estimatedRevenue - estimatedCost,
    estimatedProfitNoDep: estimatedRevenue - estimatedCostNoDep,
    totalUnits,
  }
}

function emptyBreakdown(): UnitCostBreakdown {
  return {
    ingredients: 0,
    packaging: 0,
    labor: 0,
    utilities: 0,
    marketing: 0,
    depreciation: 0,
    total: 0,
    totalWithoutDepreciation: 0,
  }
}

export function formatCAD(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat(currency === 'CAD' ? 'en-CA' : 'ja-JP', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount)
}

export function formatAmountBasis(basis: AmountBasis, productType: 'mochi' | 'onigiri'): string {
  if (basis === 'per_batch') return 'per batch'
  return productType === 'mochi' ? 'per mochi' : 'per onigiri'
}

export function generateId(): string {
  return crypto.randomUUID()
}
