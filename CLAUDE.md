# CLAUDE.md — adhd-timer-ts

Project context for Claude Code. Read this before touching any file.

## What this is

A personal ADHD focus timer built as a React + TypeScript single-page app. It combines a countdown timer, a pre-block focus checklist, and a task backlog with multi-block support. State persists to localStorage via Zustand. Intended to run locally or on a personal VPS.

## Stack

| Tool | Version | Role |
| --- | --- | --- |
| React | 19 | UI |
| TypeScript | 6 | Language — strict mode, no `any` |
| Vite | 8 | Dev server + bundler |
| Zustand | 5 | Global state + localStorage persistence |
| @tabler/icons-react | 3 | Icons — tree-shaken, typed React components |

## Commands

```bash
npm run dev       # start dev server at localhost:5173
npm run build     # tsc -b && vite build — always run before committing
npm run lint      # eslint
npm run preview   # serve the dist/ build locally
```

Always run `npm run build` after changes. The build runs `tsc -b` first so TypeScript errors surface before Vite bundles.

## shadcn/ui components

Always install shadcn components via the CLI — never create them manually:

```bash
npx shadcn@latest add <component>
```

Then adapt the generated file to use the project's existing CSS class names instead of Tailwind utilities, consistent with the rest of `src/components/ui/`.

## Version control

- After completing a task, ask the user if they want a commit before creating one.
- **Never `git push` unless the user explicitly asks for it.**

## Project structure

```raw
src/
  types.ts          # All shared interfaces and constants (Task, TimerState, RULE_COUNT)
  store.ts          # Zustand store — single source of truth, persisted to localStorage
  styles.css        # Global styles — no CSS modules, single file
  App.tsx           # Root layout — composes Timer, Stats, Checklist, Backlog
  main.tsx          # Entry point — strict null check on root element
  vite-env.d.ts     # Vite + CSS type declarations
  components/
    Timer.tsx       # Countdown timer with wall-clock logic, sound, ring canvas
    Stats.tsx       # Blocks done / focus minutes / streak display
    Checklist.tsx   # Pre-block focus rules with progress bar
    Backlog.tsx     # Task list with block count and done/delete actions
```

## Architecture decisions

### Wall-clock timer (important)

`Timer.tsx` does NOT count ticks. It stores `endTimeRef = Date.now() + remaining * 1000` and calculates `secLeft = Math.round((endTime - Date.now()) / 1000)` on each interval. This means the timer stays accurate even when the browser throttles the tab in the background. The interval runs at 500ms (not 1000ms) to avoid missing the end boundary.

When pausing, the remaining seconds are snapshotted into `pausedRemainingRef` so resume works correctly.

### State persistence

`store.ts` uses Zustand `persist` with `partialize` to only write specific fields to localStorage:

- **Persisted**: `tasks`, `blocksDone`, `totalFocusMin`, `streak`, `lastBlockDate`
- **Not persisted**: `rulesChecked`, `activeTaskId` — these reset intentionally on every session

The localStorage key is `adhd-timer-kees`.

### Types live in one place

All interfaces go in `types.ts`. `RULE_COUNT` is a const there that `Checklist.tsx` uses to stay in sync with the `RULES` array. If you add a rule, bump `RULE_COUNT` and add to the array — a runtime guard will throw if they diverge.

### Icons

Use `@tabler/icons-react` for all icons. Import individually:

```ts
import { IconPlayerPlay, IconTrash } from "@tabler/icons-react"
```

Never use inline SVG — the whole point of installing the package was to get rid of them.

### No CSS modules

All styles are in `src/styles.css`. Class names follow a short BEM-ish convention. Add new styles there, not inline (except one-off layout nudges like `marginTop`).

## TypeScript rules

- Strict mode is on including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- No `any` — ever
- All component return types are `React.ReactElement` (not `JSX.Element` — that namespace isn't available without explicit import in this config)
- `useRef` for DOM elements: `useRef<HTMLCanvasElement>(null)`
- `useRef` for intervals: `useRef<ReturnType<typeof setInterval> | null>(null)`
- Props interfaces defined inline in the same file as the component

## Sound

Two audio functions in `Timer.tsx`:

- `playWarning()` — two soft beeps, fires 30 seconds before end (only once per block, guarded by `warnedRef`)
- `playDone()` — three rising tones, fires when block completes

Both wrapped in try/catch because `AudioContext` can be unavailable. Sound can be toggled via the volume button in the duration row. The toggle state lives in local component state (not the store) because it's a UI preference, not business data. `soundOnRef` mirrors it so the audio callbacks always read the current value.

## Extending this project

### Adding a new checklist rule

1. Add the rule object to the `RULES` array in `Checklist.tsx`
2. Increment `RULE_COUNT` in `types.ts`
3. The runtime guard will throw in dev if they're out of sync

### Adding a new persisted field

1. Add to the `TimerState` interface in `types.ts`
2. Add initial value and action to `store.ts`
3. Add the field to the `PersistedState` pick in `store.ts` if it should survive page refresh

### Adding a new component

1. Create `src/components/MyComponent.tsx`
2. Return type `React.ReactElement`
3. Import store selectors individually: `useTimerStore((s) => s.fieldName)`
4. Import icons from `@tabler/icons-react`
5. Add styles to `styles.css`
6. Mount in `App.tsx`

### Reduced motion / animations

The `reducedMotion: boolean | null` field in the store controls a `reduced-motion` class on `<html>`, resolved in `App.tsx`. The store value maps as follows:

| Store value | UI label | `reduced-motion` class | Confetti |
|-------------|----------|------------------------|---------|
| `null` | Automatisch (volgt systeem) | follows OS `prefers-reduced-motion` | follows OS |
| `false` | Altijd aan | absent | ✓ fires |
| `true` | Altijd uit | present | ✗ blocked |

**Important:** the UI control is labelled "Confetti & animaties" (animations perspective), so "Altijd uit" = `reducedMotion: true` = class present = no animations. This is the inverse of what the field name suggests — don't flip it back.

CSS animations are disabled under `.reduced-motion` using `data-state` selectors (not bare class selectors) to prevent replaying when the setting changes while a dialog is open.

Components that fire animations must check `document.documentElement.classList.contains("reduced-motion")` — do **not** subscribe to the store value directly, as that causes re-renders mid-animation.

## Known constraints

- No routing — single page, no React Router
- No backend — everything is client-side localStorage
- No test setup yet — `npm run build` passing is the current quality gate
- The canvas ring in `Timer.tsx` is drawn imperatively via `useEffect` — keep draw calls inside effects, not render
