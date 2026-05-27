import React, { useRef, useState } from "react"
import { IconDownload, IconUpload, IconMenu2 } from "@tabler/icons-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTimerStore } from "../store"
import type { PersistedData } from "../types"

function getExportData(): PersistedData {
  const s = useTimerStore.getState()
  return {
    tasks: s.tasks,
    blocksDone: s.blocksDone,
    totalFocusMin: s.totalFocusMin,
    streak: s.streak,
    lastBlockDate: s.lastBlockDate,
  }
}

function isPersistedData(v: unknown): v is PersistedData {
  if (typeof v !== "object" || v === null) return false
  const o = v as Record<string, unknown>
  return (
    Array.isArray(o["tasks"]) &&
    typeof o["blocksDone"] === "number" &&
    typeof o["totalFocusMin"] === "number" &&
    typeof o["streak"] === "number" &&
    (o["lastBlockDate"] === null || typeof o["lastBlockDate"] === "string")
  )
}

export default function DataModal(): React.ReactElement {
  const loadData = useTimerStore((s) => s.loadData)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importOk, setImportOk] = useState(false)
  const [open, setOpen] = useState(false)

  const json = JSON.stringify(getExportData(), null, 2)

  const handleDownload = (): void => {
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `adhd-timer-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setImportError(null)
    setImportOk(false)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed: unknown = JSON.parse(ev.target?.result as string)
        if (!isPersistedData(parsed)) {
          setImportError("Ongeldig formaat — is dit een backup van deze app?")
          return
        }
        loadData(parsed)
        setImportOk(true)
      } catch {
        setImportError("Kan het bestand niet lezen.")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setImportError(null); setImportOk(false) } }}>
      <DialogTrigger asChild>
        <button className="hamburger-btn" aria-label="Menu">
          <IconMenu2 size={16} />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Data</DialogTitle>
        </DialogHeader>

        <div className="data-section">
          <div className="data-section-label">Export</div>
          <p className="data-section-sub">Download een JSON-backup of kopieer de data hieronder.</p>
          <Button variant="default" onClick={handleDownload} className="data-btn">
            <IconDownload size={13} />
            Download backup
          </Button>
          <textarea className="data-textarea" readOnly value={json} />
        </div>

        <div className="data-divider" />

        <div className="data-section">
          <div className="data-section-label">Import</div>
          <p className="data-section-sub">Laad een eerder geëxporteerde backup. Dit overschrijft alle huidige data.</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleFileChange}
          />
          <Button variant="default" onClick={() => fileRef.current?.click()} className="data-btn">
            <IconUpload size={13} />
            Kies bestand
          </Button>
          {importError !== null && <div className="data-feedback error">{importError}</div>}
          {importOk && <div className="data-feedback ok">Backup geladen.</div>}
        </div>
      </DialogContent>
    </Dialog>
  )
}
