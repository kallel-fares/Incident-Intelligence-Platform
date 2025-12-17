import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import AlarmFeed from './components/AlarmFeed'
import BriefingPanel from './components/BriefingPanel'
import CostModelPage from './components/CostModelPage'

function IncidentView() {
  const [selectedAlarm, setSelectedAlarm] = useState(null)

  return (
    <div className="flex flex-1 overflow-hidden h-full">
      <div className="w-72 shrink-0 border-r border-[var(--border)] overflow-y-auto bg-[var(--surface)]">
        <div className="px-3 pt-3 pb-1">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
            Active Alarms
          </div>
        </div>
        <AlarmFeed selectedAlarm={selectedAlarm} onSelectAlarm={setSelectedAlarm} />
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedAlarm ? (
          <BriefingPanel alarm={selectedAlarm} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-[var(--text-muted)]">
            <div className="text-4xl opacity-20">⚡</div>
            <div className="text-sm font-medium">Select an alarm to view the incident briefing</div>
            <div className="text-xs">Scenario C has the most complex case — start there</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen overflow-hidden">
        <Header />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<IncidentView />} />
            <Route path="/cost-model" element={
              <div className="h-full overflow-y-auto">
                <CostModelPage />
              </div>
            } />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
