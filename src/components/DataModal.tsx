import React, { useRef, useState } from "react"
import { IconDownload, IconUpload, IconMenu2, IconAlertTriangle, IconCopy, IconCheck } from "@tabler/icons-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

function tryParse(text: string): PersistedData | null {
  try {
    const parsed: unknown = JSON.parse(text)
    return isPersistedData(parsed) ? parsed : null
  } catch {
    return null
  }
}

export default function DataModal(): React.ReactElement {
  const loadData = useTimerStore((s) => s.loadData)
  const setReducedMotion = useTimerStore((s) => s.setReducedMotion)
  // "on" = animations on = reducedMotion false, "off" = animations off = reducedMotion true
  const [motionPref, setMotionPref] = useState<"auto" | "on" | "off">(() => {
    const v = useTimerStore.getState().reducedMotion
    return v === null ? "auto" : v ? "off" : "on"
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importOk, setImportOk] = useState(false)
  const [importText, setImportText] = useState<string>("")
  const [open, setOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [copied, setCopied] = useState(false)

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

  const handleCopy = (): void => {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => undefined)
  }

  const handleReset = (): void => {
    loadData({ tasks: [], blocksDone: 0, totalFocusMin: 0, streak: 0, lastBlockDate: null })
    setConfirmReset(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setImportError(null)
    setImportOk(false)
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = tryParse(ev.target?.result as string)
      if (!result) { setImportError("Ongeldig formaat — is dit een backup van deze app?"); return }
      loadData(result)
      setImportOk(true)
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleTextImport = (): void => {
    setImportError(null)
    setImportOk(false)
    if (importText.trim() === "") { setImportError("Plak eerst JSON in het tekstveld."); return }
    const result = tryParse(importText.trim())
    if (!result) { setImportError("Ongeldig formaat — is dit een backup van deze app?"); return }
    loadData(result)
    setImportOk(true)
    setImportText("")
  }

  const resetFeedback = (): void => {
    setImportError(null)
    setImportOk(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { resetFeedback(); setConfirmReset(false); setImportText("") } }}>
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
          <div className="data-btn-row">
            <Button variant="default" onClick={handleDownload} className="data-btn">
              <IconDownload size={13} />
              Download backup
            </Button>
            <Button variant="default" onClick={handleCopy} className="data-btn">
              {copied ? <IconCheck size={13} /> : <IconCopy size={13} />}
              {copied ? "Gekopieerd!" : "Kopieer JSON"}
            </Button>
          </div>
          <textarea className="data-textarea" readOnly value={json} />
        </div>

        <div className="data-divider" />

        <div className="data-section">
          <div className="data-section-label">Import</div>
          <p className="data-section-sub">Laad via bestand of plak JSON hieronder. Dit overschrijft alle huidige data.</p>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleFileChange}
          />
          <Button variant="default" onClick={() => { resetFeedback(); fileRef.current?.click() }} className="data-btn" style={{ alignSelf: "flex-start" }}>
            <IconUpload size={13} />
            Kies bestand
          </Button>
          <textarea
            className="data-textarea"
            placeholder="Of plak JSON hier..."
            value={importText}
            onChange={(e) => { setImportText(e.target.value); resetFeedback() }}
            spellCheck={false}
          />
          <Button
            variant="default"
            onClick={handleTextImport}
            className="data-btn"
            style={{ alignSelf: "flex-start" }}
          >
            Laden
          </Button>
          {importError !== null && <div className="data-feedback error">{importError}</div>}
          {importOk && <div className="data-feedback ok">Backup geladen.</div>}
        </div>

        <div className="data-divider" />

        <div className="data-section">
          <div className="data-section-label">Toegankelijkheid</div>
          <div className="data-setting-row">
            <span className="data-setting-label">Confetti &amp; animaties</span>
            <Select
              value={motionPref}
              onValueChange={(v: string) => {
                const val = v as "auto" | "on" | "off"
                setMotionPref(val)
                setReducedMotion(val === "auto" ? null : val === "off")
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatisch (volgt systeem)</SelectItem>
                <SelectItem value="on">Altijd aan</SelectItem>
                <SelectItem value="off">Altijd uit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="data-divider" />

        <div className="data-section">
          <div className="data-section-label danger-label">Gevaarzone</div>
          <p className="data-section-sub">Verwijdert alle taken, statistieken en streak permanent.</p>
          {!confirmReset ? (
            <Button variant="default" onClick={() => setConfirmReset(true)} className="data-btn danger-btn">
              <IconAlertTriangle size={13} />
              Alles resetten
            </Button>
          ) : (
            <div className="danger-confirm">
              <span>Zeker weten?</span>
              <Button variant="default" onClick={handleReset} className="data-btn danger-btn">
                Ja, reset alles
              </Button>
              <Button variant="default" onClick={() => setConfirmReset(false)} className="data-btn">
                Annuleren
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
