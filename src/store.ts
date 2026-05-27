import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { TimerState, Task, PersistedData } from './types'
import { RULE_COUNT } from './types'

type PersistedState = Pick<
  TimerState,
  'tasks' | 'blocksDone' | 'totalFocusMin' | 'streak' | 'lastBlockDate'
>

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // --- tasks ---
      tasks: [],
      activeTaskId: null,

      addTask: (title: string, blocks: number) =>
        set((s) => ({
          tasks: [
            ...s.tasks,
            { id: Date.now(), title, blocks, blocksSpent: 0, done: false } satisfies Task,
          ],
        })),

      selectTask: (id: number) => set({ activeTaskId: id }),

      completeTask: (id: number) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: true } : t)),
          activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
        })),

      deleteTask: (id: number) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
          activeTaskId: s.activeTaskId === id ? null : s.activeTaskId,
        })),

      incrementBlocksSpent: (id: number) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, blocksSpent: t.blocksSpent + 1 } : t
          ),
        })),

      // --- stats ---
      blocksDone: 0,
      totalFocusMin: 0,
      streak: 0,
      lastBlockDate: null,

      recordBlock: (minutes: number) => {
        const today = new Date().toDateString()
        const { lastBlockDate, streak } = get()
        set((s) => ({
          blocksDone: s.blocksDone + 1,
          totalFocusMin: s.totalFocusMin + minutes,
          streak: lastBlockDate === today ? streak + 1 : 1,
          lastBlockDate: today,
        }))
      },

      // --- checklist ---
      rulesChecked: Array<boolean>(RULE_COUNT).fill(false),

      toggleRule: (index: number) =>
        set((s) => {
          const next = [...s.rulesChecked]
          next[index] = !next[index]
          return { rulesChecked: next }
        }),

      resetRules: () =>
        set({ rulesChecked: Array<boolean>(RULE_COUNT).fill(false) }),

      loadData: (data: PersistedData) =>
        set({
          tasks: data.tasks,
          blocksDone: data.blocksDone,
          totalFocusMin: data.totalFocusMin,
          streak: data.streak,
          lastBlockDate: data.lastBlockDate,
          activeTaskId: null,
        }),
    }),
    {
      name: 'adhd-timer-kees',
      storage: createJSONStorage(() => localStorage),
      partialize: (s): PersistedState => ({
        tasks: s.tasks,
        blocksDone: s.blocksDone,
        totalFocusMin: s.totalFocusMin,
        streak: s.streak,
        lastBlockDate: s.lastBlockDate,
      }),
    }
  )
)
