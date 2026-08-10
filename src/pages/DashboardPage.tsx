import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  aggregateProduction,
  aggregateSales,
  calculateProfitEstimate,
  formatCAD,
} from '../lib/calculations'
import { Card, PageHeader, StatBox } from '../components/ui'

export function DashboardPage() {
  const { data } = useApp()
  const prodAgg = aggregateProduction(data)
  const salesAgg = aggregateSales(data.sales)

  const actualProfit = salesAgg.totalRevenue - prodAgg.estimatedCost
  const actualProfitNoDep = salesAgg.totalRevenue - prodAgg.estimatedCostNoDep
  const revenueVariance = salesAgg.totalRevenue - prodAgg.estimatedRevenue

  const recentProduction = [...data.production]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  const recentSales = [...data.sales]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Estimated vs actual performance"
      />

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-ink-muted mb-2 uppercase tracking-wide">
          Profit Comparison
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <StatBox
            label="Est. Profit (w/ depreciation)"
            value={formatCAD(prodAgg.estimatedProfit)}
            subValue={`${prodAgg.totalUnits} units produced`}
            variant={prodAgg.estimatedProfit >= 0 ? 'positive' : 'negative'}
          />
          <StatBox
            label="Est. Profit (no depreciation)"
            value={formatCAD(prodAgg.estimatedProfitNoDep)}
            variant={prodAgg.estimatedProfitNoDep >= 0 ? 'positive' : 'negative'}
          />
          <StatBox
            label="Actual Sales Revenue"
            value={formatCAD(salesAgg.totalRevenue)}
            subValue={`${salesAgg.totalUnits} units sold`}
          />
          <StatBox
            label="Actual Profit (w/ depreciation)"
            value={formatCAD(actualProfit)}
            subValue="Sales revenue − est. cost"
            variant={actualProfit >= 0 ? 'positive' : 'negative'}
          />
          <StatBox
            label="Actual Profit (no depreciation)"
            value={formatCAD(actualProfitNoDep)}
            variant={actualProfitNoDep >= 0 ? 'positive' : 'negative'}
          />
          <StatBox
            label="Revenue Variance"
            value={formatCAD(revenueVariance)}
            subValue="Actual − Estimated"
            variant={revenueVariance >= 0 ? 'positive' : 'negative'}
          />
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-ink-muted mb-2 uppercase tracking-wide">
          Cost per Unit (Avg Estimate)
        </h2>
        <Card>
          {prodAgg.totalUnits > 0 ? (
            <div className="space-y-2 text-sm">
              <CostRow
                label="With depreciation"
                value={formatCAD(prodAgg.estimatedCost / prodAgg.totalUnits)}
              />
              <CostRow
                label="Without depreciation"
                value={formatCAD(prodAgg.estimatedCostNoDep / prodAgg.totalUnits)}
              />
              <CostRow
                label="Avg selling price (actual)"
                value={
                  salesAgg.totalUnits > 0
                    ? formatCAD(salesAgg.totalRevenue / salesAgg.totalUnits)
                    : '—'
                }
              />
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Log production to see cost estimates.</p>
          )}
        </Card>
      </section>

      <section className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
            Recent Production
          </h2>
          <Link to="/production" className="text-xs text-matcha-dark font-medium">
            View all →
          </Link>
        </div>
        {recentProduction.length === 0 ? (
          <Card>
            <p className="text-sm text-ink-muted text-center py-2">
              No production logged yet.{' '}
              <Link to="/production" className="text-matcha-dark">Add entry</Link>
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentProduction.map((entry) => {
              const est = calculateProfitEstimate(entry, data)
              return (
                <Card key={entry.id}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{entry.productName}</div>
                      <div className="text-xs text-ink-muted">
                        {entry.date} · {entry.quantity} units · {entry.packagingType === 'individual' ? 'Individual' : 'Box of 4'}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-matcha-dark font-medium">
                        {formatCAD(est.profitPerUnit)}/unit
                      </div>
                      <div className="text-xs text-ink-muted">
                        ({formatCAD(est.profitPerUnitWithoutDepreciation)} no dep.)
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
            Recent Sales
          </h2>
          <Link to="/sales" className="text-xs text-matcha-dark font-medium">
            View all →
          </Link>
        </div>
        {recentSales.length === 0 ? (
          <Card>
            <p className="text-sm text-ink-muted text-center py-2">
              No sales logged yet.{' '}
              <Link to="/sales" className="text-matcha-dark">Add sale</Link>
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentSales.map((sale) => (
              <Card key={sale.id}>
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{sale.productName}</div>
                    <div className="text-xs text-ink-muted">
                      {sale.date} · {sale.quantity} × {formatCAD(sale.unitPriceCAD)}
                    </div>
                  </div>
                  <div className="font-medium text-sm">
                    {formatCAD(sale.quantity * sale.unitPriceCAD)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
