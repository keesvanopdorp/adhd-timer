import React, { useState } from "react"
import {
  IconPlayerPlay,
  IconCheck,
  IconTrash,
  IconPlus,
  IconScissors,
  IconChevronDown,
} from "@tabler/icons-react"
import { useTimerStore } from "../store"
import type { Task } from "../types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BacklogItemProps {
  task: Task
  isActive: boolean
  onSelect: (id: number) => void
  onComplete: (id: number) => void
  onDelete: (id: number) => void
}

function BacklogItem({
  task,
  isActive,
  onSelect,
  onComplete,
  onDelete,
}: BacklogItemProps): React.ReactElement {
  const classes = ["backlog-item", isActive ? "active" : "", task.done ? "done" : ""]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={classes}>
      <div className="bi-body">
        <div className="bi-title">{task.title}</div>
        <div className="bi-meta">
          <Badge variant={task.blocks === 1 ? "teal" : "amber"}>
            {task.blocks} block{task.blocks > 1 ? "s" : ""}
          </Badge>
          {task.blocksSpent > 0 && (
            <span className="bi-progress">
              {task.blocksSpent}/{task.blocks} gedaan
            </span>
          )}
        </div>
      </div>
      <div className="bi-actions">
        {!task.done && (
          <Button variant="ghost" onClick={() => onSelect(task.id)} title="Selecteer">
            <IconPlayerPlay size={13} />
          </Button>
        )}
        {!task.done && (
          <Button variant="ghost-green" onClick={() => onComplete(task.id)} title="Afronden">
            <IconCheck size={13} />
          </Button>
        )}
        <Button variant="ghost-red" onClick={() => onDelete(task.id)} title="Verwijderen">
          <IconTrash size={13} />
        </Button>
      </div>
    </div>
  )
}

const BLOCK_OPTIONS = [1, 2, 3, 4, 5] as const
type BlockOption = (typeof BLOCK_OPTIONS)[number]

export default function Backlog(): React.ReactElement {
  const tasks = useTimerStore((s) => s.tasks)
  const activeTaskId = useTimerStore((s) => s.activeTaskId)
  const addTask = useTimerStore((s) => s.addTask)
  const selectTask = useTimerStore((s) => s.selectTask)
  const completeTask = useTimerStore((s) => s.completeTask)
  const deleteTask = useTimerStore((s) => s.deleteTask)

  const [open, setOpen] = useState<boolean>(true)
  const [input, setInput] = useState<string>("")
  const [blocks, setBlocks] = useState<BlockOption>(1)
  const [showSplit, setShowSplit] = useState<boolean>(false)

  const handleAdd = (): void => {
    const title = input.trim()
    if (!title) return
    addTask(title, blocks)
    setInput("")
    if (blocks > 1) {
      setShowSplit(true)
      setTimeout(() => setShowSplit(false), 4000)
    }
  }

  const handleBlocksChange = (val: string): void => {
    const n = parseInt(val, 10)
    if ((BLOCK_OPTIONS as readonly number[]).includes(n)) {
      setBlocks(n as BlockOption)
    }
  }

  const sorted: Task[] = [
    ...tasks.filter((t) => !t.done),
    ...tasks.filter((t) => t.done),
  ]

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="section-toggle">
          <span className="lbl" style={{ margin: 0 }}>Taak backlog</span>
          <IconChevronDown
            size={13}
            className={open ? "chevron-open" : "chevron-closed"}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="add-task-row">
          <Input
            type="text"
            placeholder="Nieuwe taak toevoegen..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Select value={String(blocks)} onValueChange={handleBlocksChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOCK_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n === 5 ? "5+" : n} block{n > 1 ? "s" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="default"
            onClick={handleAdd}
            style={{ width: 36, padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <IconPlus size={15} />
          </Button>
        </div>

        {showSplit && (
          <div className="split-hint">
            <IconScissors size={13} />
            Deze taak past niet in één block — overweeg hem op te splitsen.
          </div>
        )}

        <div className="backlog-list">
          {sorted.length === 0 ? (
            <div className="empty-state">Nog geen taken — voeg er een toe hierboven.</div>
          ) : (
            sorted.map((task) => (
              <BacklogItem
                key={task.id}
                task={task}
                isActive={task.id === activeTaskId}
                onSelect={selectTask}
                onComplete={completeTask}
                onDelete={deleteTask}
              />
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
