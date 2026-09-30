import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Button, Card, Input, PageHeader } from '../components/ui'

export function SettingsPage() {
  const { data, updateData, resetData } = useApp()
  const [jpyToCad, setJpyToCad] = useState(String(data.settings.jpyToCad))
  const [hourlyWage, setHourlyWage] = useState(String(data.settings.defaultHourlyWageCAD))
  const [confirmReset, setConfirmReset] = useState(false)

  const handleSave = () => {
    const rate = parseFloat(jpyToCad)
    const wage = parseFloat(hourlyWage)
    if (isNaN(rate) || rate <= 0) return
    if (isNaN(wage) || wage < 0) return
    updateData((prev) => ({
      ...prev,
      settings: { jpyToCad: rate, defaultHourlyWageCAD: wage },
    }))
  }

  const handleReset = () => {
    if (confirmReset) {
      resetData()
      setJpyToCad(String(0.0092))
      setHourlyWage(String(18))
      setConfirmReset(false)
    } else {
      setConfirmReset(true)
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Exchange rate, wages & data management"
      />

      <Card className="mb-4">
        <h2 className="font-medium mb-3">JPY → CAD Exchange Rate</h2>
        <p className="text-xs text-ink-muted mb-3">
          Used to convert Japanese supply costs to CAD for profit calculations.
          Selling is always in CAD.
        </p>
        <Input
          label="1 JPY = ? CAD"
          value={jpyToCad}
          onChange={setJpyToCad}
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          hint="Example: 0.0092 means ¥100 ≈ $0.92 CAD"
        />
        <div className="text-xs text-ink-muted mt-2 text-center">
          ¥1,000 ≈ ${(parseFloat(jpyToCad || '0') * 1000).toFixed(2)} CAD
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="font-medium mb-3">Default Hourly Wage</h2>
        <p className="text-xs text-ink-muted mb-3">
          Used when logging production labor. You can override per batch.
        </p>
        <Input
          label="Hourly wage (CAD)"
          value={hourlyWage}
          onChange={setHourlyWage}
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          hint="e.g. $18.00/hr — pre-filled when logging a batch"
        />
      </Card>

      <Button onClick={handleSave} className="w-full mb-4">
        Save Settings
      </Button>

      <Card className="mb-4">
        <h2 className="font-medium mb-2">How it works</h2>
        <ol className="text-xs text-ink-muted space-y-2 list-decimal list-inside">
          <li>Add supplies with package size & cost (JPY or CAD)</li>
          <li>Define mochi & onigiri recipes with batch yield</li>
          <li>Add fixed assets — depreciation is split per unit produced</li>
          <li>Log production with wage × hours × people for labor cost</li>
          <li>Log sales to compare actual vs estimated revenue</li>
        </ol>
      </Card>

      <Card>
        <h2 className="font-medium mb-2 text-sakura-dark">Danger Zone</h2>
        <p className="text-xs text-ink-muted mb-3">
          Reset all data stored in this browser. This cannot be undone.
        </p>
        <Button
          variant={confirmReset ? 'danger' : 'secondary'}
          onClick={handleReset}
          className="w-full"
        >
          {confirmReset ? 'Confirm — Delete All Data' : 'Reset All Data'}
        </Button>
        {confirmReset && (
          <Button variant="ghost" onClick={() => setConfirmReset(false)} className="w-full mt-2">
            Cancel
          </Button>
        )}
      </Card>
    </div>
  )
}
