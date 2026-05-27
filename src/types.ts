export interface Task {
  id: number
  title: string
  blocks: number
  blocksSpent: number
  done: boolean
}

export interface TimerState {
  // tasks
  tasks: Task[]
  activeTaskId: number | null
  addTask: (title: string, blocks: number) => void
  selectTask: (id: number) => void
  completeTask: (id: number) => void
  deleteTask: (id: number) => void
  incrementBlocksSpent: (id: number) => void

  // stats
  blocksDone: number
  totalFocusMin: number
  streak: number
  lastBlockDate: string | null
  recordBlock: (minutes: number) => void

  // checklist
  rulesChecked: boolean[]
  toggleRule: (index: number) => void
  resetRules: () => void

  // data management
  loadData: (data: PersistedData) => void
}

export interface PersistedData {
  tasks: Task[]
  blocksDone: number
  totalFocusMin: number
  streak: number
  lastBlockDate: string | null
}

export const RULE_COUNT = 6
