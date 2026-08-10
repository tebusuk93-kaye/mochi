export type Currency = 'JPY' | 'CAD'
export type Unit = 'g' | 'ml' | 'piece'
export type ProductType = 'mochi' | 'onigiri' | 'rice_cracker'
export type PackagingType = 'individual' | 'box_of_4'
export type SupplyCategory = 'ingredient' | 'packaging_individual' | 'packaging_box' | 'packaging_inner'

export interface Settings {
  jpyToCad: number
}

export interface Supply {
  id: string
  name: string
  category: SupplyCategory
  unit: Unit
  packageSize: number
  packageCost: number
  currency: Currency
  notes?: string
}

export interface FixedAsset {
  id: string
  name: string
  category: 'equipment' | 'reusable_packaging'
  totalCost: number
  currency: Currency
  expectedTotalUnits: number
  notes?: string
}

export interface RecipeIngredient {
  supplyId: string
  amount: number
}

export interface Recipe {
  id: string
  name: string
  productType: 'mochi'
  batchYield: number
  baseIngredients: RecipeIngredient[]
  fillingIngredient?: RecipeIngredient
  individualPackagingId?: string
  boxPackagingId?: string
  innerPackagingId?: string
  notes?: string
}

export interface ImportedProduct {
  id: string
  name: string
  productType: 'onigiri' | 'rice_cracker'
  unitCost: number
  costCurrency: Currency
  estimatedRetailPriceCAD: number
  notes?: string
}

export interface ProductionEntry {
  id: string
  date: string
  productType: ProductType
  recipeId?: string
  importedProductId?: string
  productName: string
  quantity: number
  packagingType: PackagingType
  laborCostCAD: number
  utilitiesCostCAD: number
  marketingCostCAD: number
  estimatedRetailPriceCAD: number
  notes?: string
}

export interface SaleEntry {
  id: string
  date: string
  productType: ProductType
  productName: string
  quantity: number
  unitPriceCAD: number
  productionEntryId?: string
  notes?: string
}

export interface AppData {
  settings: Settings
  supplies: Supply[]
  fixedAssets: FixedAsset[]
  recipes: Recipe[]
  importedProducts: ImportedProduct[]
  production: ProductionEntry[]
  sales: SaleEntry[]
}

export interface UnitCostBreakdown {
  ingredients: number
  packaging: number
  labor: number
  utilities: number
  marketing: number
  depreciation: number
  total: number
  totalWithoutDepreciation: number
}

export interface ProfitEstimate {
  costPerUnit: UnitCostBreakdown
  profitPerUnit: number
  profitPerUnitWithoutDepreciation: number
  profitPerBatch: number
  profitPerBatchWithoutDepreciation: number
  revenuePerUnit: number
  revenuePerBatch: number
}
