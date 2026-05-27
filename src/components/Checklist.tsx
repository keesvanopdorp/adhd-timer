import React from "react"
import { cn } from "@/lib/utils"
import {
  IconDeviceMobileOff,
  IconList,
  IconHeadphones,
  IconBrowserOff,
  IconMessageOff,
  IconClockPause,
  IconCircle,
  IconCircleCheck,
} from "@tabler/icons-react"
import { useTimerStore } from "../store"
import { RULE_COUNT } from "../types"

interface Rule {
  title: string
  sub: string
  icon: React.ReactElement
}

const RULES: Rule[] = [
  {
    title: "Telefoon weg",
    sub: "Omgekeerd neerleggen, niet storen. Uit het zicht = uit het hoofd.",
    icon: <IconDeviceMobileOff size={15} />,
  },
  {
    title: "Één taak",
    sub: "Nieuwe ideeën opschrijven en negeren.",
    icon: <IconList size={15} />,
  },
  {
    title: "Geluid klaar",
    sub: "Brown noise, lo-fi of stilte. Geen tekst, geen podcasts.",
    icon: <IconHeadphones size={15} />,
  },
  {
    title: "Tabs dicht",
    sub: 'Alleen wat je nodig hebt. Geen "even snel" check.',
    icon: <IconBrowserOff size={15} />,
  },
  {
    title: "Teams / Slack gedempt",
    sub: "Niet storen voor de duur van het block.",
    icon: <IconMessageOff size={15} />,
  },
  {
    title: "Pauze is verplicht",
    sub: "Opstaan, bewegen, water. Geen scherm in de pauze.",
    icon: <IconClockPause size={15} />,
  },
]

if (RULES.length !== RULE_COUNT) {
  throw new Error(`RULES.length (${RULES.length}) must equal RULE_COUNT (${RULE_COUNT})`)
}

export default function Checklist(): React.ReactElement {
  const rulesChecked = useTimerStore((s) => s.rulesChecked)
  const toggleRule = useTimerStore((s) => s.toggleRule)

  const done = rulesChecked.filter(Boolean).length
  const unchecked = RULE_COUNT - done
  const pct = Math.round((done / RULE_COUNT) * 100)

  return (
    <div id="checklist">
      <div className="lbl">Focus checklist</div>
      <div className="rules-progress">
        <div className="rules-bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="rules-grid">
        {RULES.map((rule, i) => (
          <div
            key={i}
            className={cn(
              "rule-row",
              rulesChecked[i] === true && "checked",
              unchecked === 1 && rulesChecked[i] !== true && "!bg-app-amber-bg !border-app-amber"
            )}
            onClick={() => toggleRule(i)}
            role="checkbox"
            aria-checked={rulesChecked[i] === true}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && toggleRule(i)}
          >
            <span className="rule-icon">{rule.icon}</span>
            <div className="rule-body">
              <div className="rule-title">{rule.title}</div>
              <div className="rule-sub">{rule.sub}</div>
            </div>
            <span className="rule-check">
              {rulesChecked[i] === true ? (
                <IconCircleCheck size={15} />
              ) : (
                <IconCircle size={15} />
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
