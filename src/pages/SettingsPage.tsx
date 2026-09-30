import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatCAD } from '../lib/calculations'
import { Button, Card, Input, PageHeader, Select } from '../components/ui'

type RateInputMode = 'jpy_to_cad' | 'cad_to_jpy'

export function SettingsPage() {
  const { data, updateData, resetData } = useApp()
  const [rateMode, setRateMode] = useState<RateInputMode>('cad_to_jpy')
  const [jpyToCad, setJpyToCad] = useState(String(data.settings.jpyToCad))
  const [cadToJpy, setCadToJpy] = useState(
    data.settings.jpyToCad > 0 ? String(1 / data.settings.jpyToCad) : '108',
  )
  const [hourlyWage, setHourlyWage] = useState(String(data.settings.defaultHourlyWageCAD))
  const [confirmReset, setConfirmReset] = useState(false)

  const effectiveJpyToCad =
    rateMode === 'jpy_to_cad'
      ? parseFloat(jpyToCad) || 0
      : (parseFloat(cadToJpy) || 0) > 0
        ? 1 / parseFloat(cadToJpy)
        : 0

  const handleSave = () => {
    const rate = effectiveJpyToCad
    const wage = parseFloat(hourlyWage)
    if (isNaN(rate) || rate <= 0) return
    if (isNaN(wage) || wage < 0) return
    updateData((prev) => ({
      ...prev,
      settings: { jpyToCad: rate, defaultHourlyWageCAD: wage },
    }))
    setJpyToCad(String(rate))
    setCadToJpy(String(1 / rate))
  }

  const handleReset = () => {
    if (confirmReset) {
      resetData()
      setJpyToCad(String(0.0092))
      setCadToJpy(String(1 / 0.0092))
      setHourlyWage(String(18))
      setConfirmReset(false)
    } else {
      setConfirmReset(true)
    }
  }

  const preview1000Jpy = effectiveJpyToCad * 1000
  const preview1Cad = effectiveJpyToCad > 0 ? 1 / effectiveJpyToCad : 0

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Exchange rate, wages & data management"
      />

      <Card className="mb-4">
        <h2 className="font-medium mb-3">JPY ↔ CAD Exchange Rate</h2>
        <p className="text-xs text-ink-muted mb-3">
          Japanese supply costs are converted to CAD for profit calculations.
          Selling is always in CAD. Update this when the rate changes.
        </p>

        <Select
          label="How do you want to enter the rate?"
          value={rateMode}
          onChange={(v) => setRateMode(v as RateInputMode)}
          options={[
            { value: 'cad_to_jpy', label: '1 CAD = ? JPY (recommended)' },
            { value: 'jpy_to_cad', label: '1 JPY = ? CAD' },
          ]}
        />

        {rateMode === 'cad_to_jpy' ? (
          <Input
            label="1 CAD = ? JPY"
            value={cadToJpy}
            onChange={setCadToJpy}
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            hint="e.g. 108 means $1 CAD ≈ ¥108"
          />
        ) : (
          <Input
            label="1 JPY = ? CAD"
            value={jpyToCad}
            onChange={setJpyToCad}
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            hint="e.g. 0.00926 means ¥1 ≈ $0.00926 CAD"
          />
        )}

        {effectiveJpyToCad > 0 && (
          <div className="text-xs text-ink-muted bg-cream rounded-xl px-3 py-2 mt-2 space-y-1">
            <div>¥1,000 → {formatCAD(preview1000Jpy)}</div>
            <div>$1 CAD → ¥{preview1Cad.toFixed(2)}</div>
            <div>¥100 → {formatCAD(effectiveJpyToCad * 100)}</div>
          </div>
        )}
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
