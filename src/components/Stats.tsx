import React from "react"
import { useTimerStore } from '../store'

export default function Stats(): React.ReactElement {
  const blocksDone = useTimerStore((s) => s.blocksDone)
  const totalFocusMin = useTimerStore((s) => s.totalFocusMin)
  const streak = useTimerStore((s) => s.streak)

  return (
    <div className="stats-row" style={{ marginTop: 16 }}>
      <div className="stat">
        <div className="stat-val">{blocksDone}</div>
        <div className="stat-lbl">blocks gedaan</div>
      </div>
      <div className="stat">
        <div className="stat-val">{totalFocusMin}</div>
        <div className="stat-lbl">focus min</div>
      </div>
      <div className="stat">
        <div className="stat-val">{streak}</div>
        <div className="stat-lbl">streak vandaag</div>
      </div>
    </div>
  )
}
