import React from "react"
import Timer from './components/Timer'
import Checklist from './components/Checklist'
import Backlog from './components/Backlog'
import Stats from './components/Stats'
import DataModal from './components/DataModal'
import { Separator } from '@/components/ui/separator'
import './styles.css'

export default function App(): React.ReactElement {
  return (
    <div className="app">
      <header className="app-header">
        <span className="app-logo">&#9632;</span>
        <span className="app-title">focus timer</span>
        <DataModal />
      </header>
      <main className="app-main">
        <Timer />
        <Stats />
        <Separator />
        <Checklist />
        <Separator />
        <Backlog />
      </main>
    </div>
  )
}
