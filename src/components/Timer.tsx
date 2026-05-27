import React, { useRef, useEffect, useState, useCallback } from "react"
import {
  IconPencil,
  IconAlertTriangle,
  IconCircleCheck,
  IconVolume,
  IconVolume2,
  IconVolume3,
  IconVolumeOff,
} from "@tabler/icons-react"
import { useTimerStore } from "../store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const DURATIONS = [10, 15, 25, 52] as const
const WARN_AT_SECONDS = 30

function drawRing(canvas: HTMLCanvasElement, pct: number, color: string): void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const cx = 90, cy = 90, r = 76
  ctx.clearRect(0, 0, 180, 180)
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.strokeStyle = "rgba(0,0,0,0.06)"
  ctx.lineWidth = 8
  ctx.stroke()
  if (pct > 0) {
    ctx.beginPath()
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct)
    ctx.strokeStyle = color
    ctx.lineWidth = 8
    ctx.lineCap = "round"
    ctx.stroke()
  }
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function playWarning(vol: number): void {
  try {
    const a = new AudioContext()
    const beep = (freq: number, start: number): void => {
      const o = a.createOscillator()
      const g = a.createGain()
      o.connect(g)
      g.connect(a.destination)
      o.frequency.value = freq
      o.type = "sine"
      g.gain.setValueAtTime(0, a.currentTime + start)
      g.gain.linearRampToValueAtTime(0.08 * vol, a.currentTime + start + 0.05)
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + start + 0.35)
      o.start(a.currentTime + start)
      o.stop(a.currentTime + start + 0.4)
    }
    beep(440, 0)
    beep(520, 0.45)
  } catch (_) {}
}

function playDone(vol: number): void {
  try {
    const a = new AudioContext()
    const beep = (freq: number, start: number): void => {
      const o = a.createOscillator()
      const g = a.createGain()
      o.connect(g)
      g.connect(a.destination)
      o.frequency.value = freq
      o.type = "sine"
      g.gain.setValueAtTime(0, a.currentTime + start)
      g.gain.linearRampToValueAtTime(0.12 * vol, a.currentTime + start + 0.04)
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + start + 0.5)
      o.start(a.currentTime + start)
      o.stop(a.currentTime + start + 0.55)
    }
    beep(440, 0)
    beep(520, 0.28)
    beep(660, 0.56)
  } catch (_) {}
}

export default function Timer(): React.ReactElement {
  const activeTaskId = useTimerStore((s) => s.activeTaskId)
  const tasks = useTimerStore((s) => s.tasks)
  const rulesChecked = useTimerStore((s) => s.rulesChecked)
  const incrementBlocksSpent = useTimerStore((s) => s.incrementBlocksSpent)
  const recordBlock = useTimerStore((s) => s.recordBlock)
  const resetRules = useTimerStore((s) => s.resetRules)

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null
  const unchecked = rulesChecked.filter((r) => !r).length

  const [workMin, setWorkMin] = useState<number>(15)
  const [customVal, setCustomVal] = useState<string>("")
  const [remaining, setRemaining] = useState<number>(15 * 60)
  const [totalSec, setTotalSec] = useState<number>(15 * 60)
  const [running, setRunning] = useState<boolean>(false)
  const [phase, setPhase] = useState<string>("klaar")
  const [showNudge, setShowNudge] = useState<boolean>(false)
  const [doneMsg, setDoneMsg] = useState<string | null>(null)
  const [soundOn, setSoundOn] = useState<boolean>(true)
  const [volume, setVolume] = useState<number>(1)
  const [showVol, setShowVol] = useState<boolean>(false)
  const [nearEnd, setNearEnd] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const endTimeRef = useRef<number | null>(null)
  const pausedRemainingRef = useRef<number>(workMin * 60)
  const warnedRef = useRef<boolean>(false)
  const effectiveVolumeRef = useRef<number>(1)
  effectiveVolumeRef.current = soundOn ? volume : 0
  const volControlRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showVol) return
    const handle = (e: MouseEvent) => {
      if (volControlRef.current && !volControlRef.current.contains(e.target as Node)) {
        setShowVol(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [showVol])

  useEffect(() => {
    if (canvasRef.current) {
      const color = nearEnd ? "#c47a0a" : "#5c54d4"
      drawRing(canvasRef.current, remaining / totalSec, color)
    }
  }, [remaining, totalSec, nearEnd])

  const setDuration = useCallback(
    (min: number): void => {
      if (running) return
      setWorkMin(min)
      setRemaining(min * 60)
      setTotalSec(min * 60)
      pausedRemainingRef.current = min * 60
      setPhase("klaar")
      setDoneMsg(null)
      setNearEnd(false)
    },
    [running]
  )

  const handleCustom = (val: string): void => {
    setCustomVal(val)
    const n = parseInt(val, 10)
    if (n > 0 && n <= 120) setDuration(n)
  }

  const handleBlockDone = useCallback((): void => {
    setRunning(false)
    setPhase("klaar!")
    setNearEnd(false)
    endTimeRef.current = null
    warnedRef.current = false

    recordBlock(workMin)
    resetRules()

    const state = useTimerStore.getState()
    const currentActiveId = state.activeTaskId
    if (currentActiveId !== null) {
      incrementBlocksSpent(currentActiveId)
      const t = state.tasks.find((t) => t.id === currentActiveId)
      if (t) {
        const left = t.blocks - t.blocksSpent - 1
        setDoneMsg(
          left > 0
            ? `Block klaar! Nog ${left} block${left > 1 ? "s" : ""} voor "${t.title}".`
            : `Alle blocks klaar voor "${t.title}" — afronden?`
        )
      }
    } else {
      setDoneMsg("Block klaar — goed gedaan. Neem je pauze.")
    }

    if (canvasRef.current) drawRing(canvasRef.current, 1, "#1a9e6e")
    if (effectiveVolumeRef.current > 0) playDone(effectiveVolumeRef.current)
  }, [workMin, recordBlock, resetRules, incrementBlocksSpent])

  const startTimer = useCallback((): void => {
    setDoneMsg(null)
    setRunning(true)
    setPhase("focus")
    warnedRef.current = false

    endTimeRef.current = Date.now() + pausedRemainingRef.current * 1000

    intervalRef.current = setInterval(() => {
      if (endTimeRef.current === null) return
      const secLeft = Math.round((endTimeRef.current - Date.now()) / 1000)

      // Warning sound when approaching end (only once)
      if (
        secLeft <= WARN_AT_SECONDS &&
        secLeft > 0 &&
        !warnedRef.current &&
        pausedRemainingRef.current > WARN_AT_SECONDS
      ) {
        warnedRef.current = true
        setNearEnd(true)
        if (effectiveVolumeRef.current > 0) playWarning(effectiveVolumeRef.current)
      }

      if (secLeft <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setRemaining(0)
        handleBlockDone()
        return
      }
      setRemaining(secLeft)
    }, 500)
  }, [handleBlockDone])

  const pauseTimer = useCallback((): void => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (endTimeRef.current !== null) {
      pausedRemainingRef.current = Math.max(
        0,
        Math.round((endTimeRef.current - Date.now()) / 1000)
      )
    }
    endTimeRef.current = null
    setRunning(false)
    setPhase("gepauzeerd")
  }, [])

  const handleStart = (): void => {
    if (running) { pauseTimer(); return }
    if (unchecked > 0) { setShowNudge(true); return }
    setShowNudge(false)
    startTimer()
  }

  const resetTimer = (): void => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    endTimeRef.current = null
    pausedRemainingRef.current = workMin * 60
    warnedRef.current = false
    setRunning(false)
    setRemaining(workMin * 60)
    setTotalSec(workMin * 60)
    setPhase("klaar")
    setDoneMsg(null)
    setShowNudge(false)
    setNearEnd(false)
  }

  useEffect(
    () => () => { if (intervalRef.current) clearInterval(intervalRef.current) },
    []
  )

  const taskLabel =
    activeTask
      ? `${activeTask.title} (block ${activeTask.blocksSpent + 1} van ${activeTask.blocks})`
      : "Selecteer een taak uit de backlog hieronder"

  const startLabel = running ? "Pauzeer" : remaining === 0 ? "Opnieuw" : "Start"

  return (
    <div className="timer-section">
      <div className="task-banner">
        <IconPencil size={13} />
        <span>{taskLabel}</span>
      </div>

      <div className="dur-row">
        {DURATIONS.map((d) => (
          <Button
            key={d}
            variant={workMin === d && customVal === "" ? "duration-active" : "duration"}
            onClick={() => { setCustomVal(""); setDuration(d) }}
          >
            {d} min
          </Button>
        ))}
        <div className="custom-dur">
          <Input
            type="number"
            min="1"
            max="120"
            placeholder="?"
            value={customVal}
            onChange={(e) => handleCustom(e.target.value)}
          />
          <span>min</span>
        </div>
        <div className="vol-control" ref={volControlRef}>
          <Button
            variant={soundOn && volume > 0 ? "duration-active" : "duration"}
            onClick={() => { if (showVol) setSoundOn((s) => !s); else setShowVol(true) }}
            title={soundOn ? "Geluid uit" : "Geluid aan"}
          >
            {!soundOn || volume === 0 ? <IconVolumeOff size={14} /> :
              volume < 0.35 ? <IconVolume3 size={14} /> :
              volume < 0.7 ? <IconVolume2 size={14} /> :
              <IconVolume size={14} />}
          </Button>
          <div className={`vol-slider-wrap${showVol ? " open" : ""}`}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              className="vol-slider"
              style={{ "--vol-fill": `${(soundOn ? volume : 0) * 100}%` } as React.CSSProperties}
              onChange={(e) => {
                const v = parseFloat(e.target.value)
                setVolume(v)
                if (v > 0 && !soundOn) setSoundOn(true)
                if (v === 0 && soundOn) setSoundOn(false)
              }}
            />
          </div>
        </div>
      </div>

      <div className="ring-wrap">
        <canvas ref={canvasRef} width="180" height="180" />
        <div className="ring-inner">
          <div className="time-display" style={{ color: nearEnd ? "var(--amber)" : undefined }}>
            {fmt(remaining)}
          </div>
          <div className="phase-label">{phase}</div>
        </div>
      </div>

      <div className="ctrl-col">
        <div className="btn-row">
          <Button variant="primary" onClick={handleStart}>{startLabel}</Button>
          <Button variant="default" onClick={resetTimer}>Reset</Button>
        </div>

        {showNudge && (
          <div className="nudge">
            <IconAlertTriangle size={13} />
            <span>
              Nog <strong>{unchecked} regel{unchecked > 1 ? "s" : ""}</strong> open.{" "}
              <a
                onClick={() => {
                  setShowNudge(false)
                  document.getElementById("checklist")?.scrollIntoView({ behavior: "smooth" })
                }}
              >
                Afvinken
              </a>
              {" "}of{" "}
              <a onClick={() => { setShowNudge(false); startTimer() }}>toch starten</a>.
            </span>
          </div>
        )}
      </div>

      {doneMsg !== null && (
        <div className="done-banner" style={{ marginTop: 12 }}>
          <IconCircleCheck size={15} />
          {doneMsg}
        </div>
      )}
    </div>
  )
}
