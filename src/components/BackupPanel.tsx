import { useRef, useState } from 'react'
import { Download, Upload, Copy, ClipboardPaste, Share2, Check } from 'lucide-react'
import { useApp } from '../context/AppContext'
import {
  downloadBackup,
  mergeAppData,
  parseBackupJson,
  serializeBackup,
  shareBackup,
} from '../lib/backup'
import { Button, Card, FormError } from './ui'

type ImportMode = 'replace' | 'merge'

export function BackupPanel() {
  const { data, replaceData } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [importMode, setImportMode] = useState<ImportMode>('replace')
  const [showPaste, setShowPaste] = useState(false)
  const [pasteValue, setPasteValue] = useState('')

  const itemCount =
    data.supplies.length +
    data.recipes.length +
    data.production.length +
    data.sales.length

  const clearStatus = () => {
    setMessage('')
    setError('')
  }

  const applyImport = (imported: ReturnType<typeof parseBackupJson>) => {
    if (importMode === 'merge') {
      replaceData(mergeAppData(data, imported))
      setMessage('Data merged successfully.')
    } else {
      replaceData(imported)
      setMessage('Data restored — all previous data was replaced.')
    }
  }

  const handleExport = () => {
    clearStatus()
    downloadBackup(data)
    setMessage('Backup file downloaded. Save it to Google Drive, iCloud, or email for safekeeping.')
  }

  const handleShare = async () => {
    clearStatus()
    try {
      const shared = await shareBackup(data)
      if (shared) {
        setMessage('Backup shared. Save to your cloud app (Drive, iCloud, etc.).')
      } else {
        handleExport()
      }
    } catch {
      handleExport()
    }
  }

  const handleCopy = async () => {
    clearStatus()
    try {
      await navigator.clipboard.writeText(serializeBackup(data))
      setMessage('Backup copied to clipboard. Paste into Notes or a message to save it.')
    } catch {
      setError('Could not copy to clipboard. Try Export instead.')
    }
  }

  const handleFileImport = (file: File) => {
    clearStatus()
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '')
        applyImport(parseBackupJson(text))
        setPasteValue('')
        setShowPaste(false)
      } catch {
        setError('Invalid backup file. Please choose a mochi-backup JSON file.')
      }
    }
    reader.onerror = () => setError('Could not read the file.')
    reader.readAsText(file)
  }

  const handlePasteImport = () => {
    clearStatus()
    if (!pasteValue.trim()) {
      setError('Paste your backup JSON first.')
      return
    }
    try {
      applyImport(parseBackupJson(pasteValue))
      setPasteValue('')
      setShowPaste(false)
    } catch {
      setError('Invalid backup data. Check that you copied the full JSON.')
    }
  }

  return (
    <Card className="mb-4">
      <h2 className="font-medium mb-2">Backup & Cloud Sync</h2>
      <p className="text-xs text-ink-muted mb-3">
        Data stays in your browser by default. Export a backup file and save it to
        Google Drive, iCloud, Dropbox, or email — then import on another device.
      </p>

      <div className="text-xs bg-cream rounded-xl px-3 py-2 mb-3 text-ink-muted">
        Current data: {itemCount} items (supplies, recipes, production, sales, etc.)
      </div>

      {message && (
        <div className="text-xs text-matcha-dark bg-matcha/10 border border-matcha/20 rounded-xl px-3 py-2 mb-3 flex items-start gap-2">
          <Check size={14} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && <div className="mb-3"><FormError message={error} /></div>}

      <div className="text-sm font-medium text-ink-muted mb-2">Export</div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button onClick={handleExport} className="flex items-center justify-center gap-2">
          <Download size={16} />
          Download
        </Button>
        <Button onClick={handleShare} variant="secondary" className="flex items-center justify-center gap-2">
          <Share2 size={16} />
          Share
        </Button>
        <Button onClick={handleCopy} variant="secondary" className="flex items-center justify-center gap-2 col-span-2">
          <Copy size={16} />
          Copy to clipboard
        </Button>
      </div>

      <div className="text-sm font-medium text-ink-muted mb-2">Import</div>
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setImportMode('replace')}
          className={`flex-1 text-xs py-2 rounded-xl border ${importMode === 'replace' ? 'border-matcha bg-matcha/10 text-matcha-dark font-medium' : 'border-border text-ink-muted'}`}
        >
          Replace all
        </button>
        <button
          type="button"
          onClick={() => setImportMode('merge')}
          className={`flex-1 text-xs py-2 rounded-xl border ${importMode === 'merge' ? 'border-matcha bg-matcha/10 text-matcha-dark font-medium' : 'border-border text-ink-muted'}`}
        >
          Merge
        </button>
      </div>
      <p className="text-xs text-ink-muted mb-3">
        {importMode === 'replace'
          ? 'Replace removes current data and uses the backup.'
          : 'Merge keeps existing items and adds/updates from the backup.'}
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileImport(file)
          e.target.value = ''
        }}
      />

      <div className="space-y-2">
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
          className="w-full flex items-center justify-center gap-2"
        >
          <Upload size={16} />
          Import from file
        </Button>
        <Button
          onClick={() => { setShowPaste(!showPaste); clearStatus() }}
          variant="ghost"
          className="w-full flex items-center justify-center gap-2"
        >
          <ClipboardPaste size={16} />
          {showPaste ? 'Hide paste box' : 'Paste backup JSON'}
        </Button>
      </div>

      {showPaste && (
        <div className="mt-3 space-y-2">
          <textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder="Paste your backup JSON here..."
            className="w-full h-32 px-3 py-2 rounded-xl border border-border bg-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-matcha/40"
          />
          <Button onClick={handlePasteImport} className="w-full">
            Import pasted data
          </Button>
        </div>
      )}
    </Card>
  )
}
