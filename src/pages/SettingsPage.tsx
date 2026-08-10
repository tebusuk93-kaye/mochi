import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Button, Card, Input, PageHeader } from '../components/ui'

export function SettingsPage() {
  const { data, updateData, resetData } = useApp()
  const [jpyToCad, setJpyToCad] = useState(String(data.settings.jpyToCad))
  const [confirmReset, setConfirmReset] = useState(false)

  const handleSave = () => {
    const rate = parseFloat(jpyToCad)
    if (isNaN(rate) || rate <= 0) return
    updateData((prev) => ({
      ...prev,
      settings: { jpyToCad: rate },
    }))
  }

  const handleReset = () => {
    if (confirmReset) {
      resetData()
      setJpyToCad(String(0.0092))
      setConfirmReset(false)
    } else {
      setConfirmReset(true)
    }
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Exchange rate & data management"
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
          hint="Example: 0.0092 means ¥100 ≈ $0.92 CAD"
        />
        <Button onClick={handleSave} className="w-full mt-3">
          Save Rate
        </Button>
        <div className="text-xs text-ink-muted mt-2 text-center">
          ¥1,000 ≈ ${(parseFloat(jpyToCad || '0') * 1000).toFixed(2)} CAD
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="font-medium mb-2">How it works</h2>
        <ol className="text-xs text-ink-muted space-y-2 list-decimal list-inside">
          <li>Add supplies with package size & cost (JPY or CAD)</li>
          <li>Define mochi recipes with batch yield (e.g. 8 mochi per batch)</li>
          <li>Add fixed assets — depreciation is split per unit produced</li>
          <li>Log production with quantity made & batch costs</li>
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
