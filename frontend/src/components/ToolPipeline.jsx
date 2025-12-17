import { useEffect, useState, useMemo } from 'react'
import { Server, Activity, History, FileText, Sparkles, Cpu } from 'lucide-react'
import { derivePhases } from '../utils/pipelinePhases'

// ── Layout: agent on top dispatching to a row of tools beneath ───────────────
// Synthesize is the agent's output, placed top-right.
// SVG uses preserveAspectRatio="none" so % node positions and viewBox line
// endpoints always align regardless of container width.
const VW = 480, VH = 150

const P = {
  agent:      { x: 165, y: 35  },
  synthesize: { x: 425, y: 35  },
  equipment:  { x: 50,  y: 110 },
  sensors:    { x: 130, y: 110 },
  incidents:  { x: 210, y: 110 },
  documents:  { x: 290, y: 110 },
}

// Half-dimensions for edge connection points (viewBox units)
const T  = { rx: 22, ry: 18 }
const AG = { rx: 32, ry: 22 }
const SY = { rx: 28, ry: 18 }

// Bidirectional pair: line out (agent→tool, lights blue when calling),
// line in (tool→agent, lights green when result returns). Offset ±2.5 in x.
function bidir(fr, to) {
  return {
    out: { x1: fr.x - 2.5, y1: fr.y, x2: to.x - 2.5, y2: to.y },
    inn: { x1: to.x + 2.5, y1: to.y, x2: fr.x + 2.5, y2: fr.y },
  }
}

const FROM = { x: P.agent.x, y: P.agent.y + AG.ry }  // agent bottom edge

const L = {
  equipment: bidir(FROM, { x: P.equipment.x, y: P.equipment.y - T.ry }),
  sensors:   bidir(FROM, { x: P.sensors.x,   y: P.sensors.y   - T.ry }),
  incidents: bidir(FROM, { x: P.incidents.x, y: P.incidents.y - T.ry }),
  documents: bidir(FROM, { x: P.documents.x, y: P.documents.y - T.ry }),
  synth: {
    x1: P.agent.x + AG.rx, y1: P.agent.y,
    x2: P.synthesize.x - SY.rx, y2: P.synthesize.y,
  },
}

// ── Colors ────────────────────────────────────────────────────────────────────
const CLR = {
  idle:      '#2e3248',
  calling:   '#60a5fa',  // blue-400
  returning: '#4ade80',  // green-400
  doneDim:   '#22c55e55',
  done:      '#22c55e',  // green-500
}

// Arrows + tool nodes only light up while a call is *in flight*. Once the
// tool returns and settles into 'complete', everything for that tool
// goes back to idle — the spotlight stays on whatever is currently active.
const outStroke   = (s) => s === 'calling'   ? CLR.calling   : CLR.idle
const inStroke    = (s) => s === 'returning' ? CLR.returning : CLR.idle
const outMarker   = (s) => s === 'calling'   ? 'mk-blue'  : 'mk-idle'
const inMarker    = (s) => s === 'returning' ? 'mk-green' : 'mk-idle'
const synthStroke = (s) => s !== 'pending' && s !== 'complete' ? CLR.calling : CLR.idle
const synthMarker = (s) => s !== 'pending' && s !== 'complete' ? 'mk-blue'   : 'mk-idle'

// Static class lookup (Tailwind v4 JIT requires literal strings).
const NODE_CLS = {
  pending:   'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
  calling:   'border-blue-400 bg-blue-500/15 text-blue-300 ring-2 ring-blue-400/30 animate-pulse',
  returning: 'border-green-400 bg-green-500/15 text-green-300 ring-2 ring-green-400/30 animate-pulse',
  complete:  'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]',
}
const LABEL_CLS = {
  pending:   'text-[var(--text-muted)]',
  calling:   'text-blue-300',
  returning: 'text-green-300',
  complete:  'text-[var(--text-muted)]',
}

// Per-tool state machine: pending → calling → returning → complete
const INIT = () => (['pending', 'pending', 'pending', 'pending'])

function setSingle(setter, i, val) {
  setter(prev => { const n = [...prev]; n[i] = val; return n })
}

const TOOLS = [
  { key: 'equipment', label: 'Equipment', Icon: Server,   posKey: 'equipment' },
  { key: 'sensors',   label: 'Sensors',   Icon: Activity, posKey: 'sensors'   },
  { key: 'incidents', label: 'Incidents', Icon: History,  posKey: 'incidents' },
  { key: 'documents', label: 'Documents', Icon: FileText, posKey: 'documents' },
]

const pct = (v, total) => `${(v / total) * 100}%`

// ─────────────────────────────────────────────────────────────────────────────
export default function ToolPipeline({ steps, skipAnimation = false }) {
  const phases = useMemo(() => derivePhases(steps), [steps])
  const [toolStates, setToolStates] = useState(INIT)
  const [synthState, setSynthState] = useState('pending')

  useEffect(() => {
    if (!phases.length) return

    if (skipAnimation) {
      setToolStates(['complete', 'complete', 'complete', 'complete'])
      setSynthState('complete')
      return
    }

    setToolStates(INIT())
    setSynthState('pending')

    const timers = []

    phases.slice(0, 4).forEach((p, i) => {
      if (p.startAt  != null) timers.push(setTimeout(() => setSingle(setToolStates, i, 'calling'),  p.startAt))
      if (p.resultAt != null) {
        timers.push(setTimeout(() => setSingle(setToolStates, i, 'returning'), p.resultAt))
        timers.push(setTimeout(() => setSingle(setToolStates, i, 'complete'),  p.resultAt + 700))
      }
    })

    const sy = phases[4]
    if (sy?.startAt != null) timers.push(setTimeout(() => setSynthState('calling'),  sy.startAt))
    if (sy?.endAt   != null) timers.push(setTimeout(() => setSynthState('complete'), sy.endAt))

    return () => timers.forEach(clearTimeout)
  }, [phases, skipAnimation])

  if (!phases.length) return null

  // Agent stays lit (blue pulse) for the duration of the trace, from the
  // first call until everything settles. Once the whole pipeline is complete
  // it returns to idle — no permanent green "done" state.
  const started = toolStates.some(s => s !== 'pending') || synthState !== 'pending'
  const allDone = toolStates.every(s => s === 'complete') && synthState === 'complete'
  const agentCls = started && !allDone
    ? 'border-blue-400 bg-blue-500/15 text-blue-300 ring-2 ring-blue-400/30 animate-pulse'
    : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-muted)]'

  const lineEntries = [
    { key: 'equipment', state: toolStates[0], conn: L.equipment },
    { key: 'sensors',   state: toolStates[1], conn: L.sensors   },
    { key: 'incidents', state: toolStates[2], conn: L.incidents },
    { key: 'documents', state: toolStates[3], conn: L.documents },
  ]

  return (
    <div className="relative w-full" style={{ height: VH }}>
      {/* SVG: connection lines + arrowheads */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        <defs>
          {[
            { id: 'mk-idle',     fill: CLR.idle      },
            { id: 'mk-blue',     fill: CLR.calling   },
            { id: 'mk-green',    fill: CLR.returning },
            { id: 'mk-done',     fill: CLR.done      },
            { id: 'mk-done-dim', fill: CLR.doneDim   },
          ].map(({ id, fill }) => (
            <marker
              key={id}
              id={id}
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
              markerUnits="userSpaceOnUse"
            >
              <path d="M0,0.5 L6,3 L0,5.5 Z" fill={fill} />
            </marker>
          ))}
        </defs>

        {/* Tool ↔ Agent bidirectional pairs */}
        {lineEntries.map(({ key, state, conn }) => (
          <g key={key}>
            <line
              {...conn.out}
              stroke={outStroke(state)}
              strokeWidth="1.5"
              markerEnd={`url(#${outMarker(state)})`}
              style={{ transition: 'stroke 0.4s' }}
            />
            <line
              {...conn.inn}
              stroke={inStroke(state)}
              strokeWidth="1.5"
              markerEnd={`url(#${inMarker(state)})`}
              style={{ transition: 'stroke 0.4s' }}
            />
          </g>
        ))}

        {/* Agent → Synthesize (single outgoing) */}
        <line
          {...L.synth}
          stroke={synthStroke(synthState)}
          strokeWidth="1.5"
          markerEnd={`url(#${synthMarker(synthState)})`}
          style={{ transition: 'stroke 0.4s' }}
        />
      </svg>

      {/* Agent (top center) */}
      <div
        className="absolute"
        style={{
          left: pct(P.agent.x, VW),
          top: pct(P.agent.y, VH),
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className={`px-3 py-1.5 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${agentCls}`}
        >
          <Cpu className="w-4 h-4" />
          <span className="text-[8px] font-bold uppercase tracking-widest">
            Agent
          </span>
        </div>
      </div>

      {/* Synthesize (top right) */}
      <div
        className="absolute flex flex-col items-center gap-1"
        style={{
          left: pct(P.synthesize.x, VW),
          top: pct(P.synthesize.y, VH),
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className={`px-3 py-1.5 rounded-xl border-2 flex items-center gap-1.5 transition-all duration-300 ${NODE_CLS[synthState] ?? NODE_CLS.pending}`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[9px] font-bold uppercase tracking-wider">
            Synth
          </span>
        </div>
      </div>

      {/* Tools row (bottom) */}
      {TOOLS.map(({ key, label, Icon, posKey }, i) => {
        const pos = P[posKey]
        const state = toolStates[i]
        return (
          <div
            key={key}
            className="absolute flex flex-col items-center gap-1"
            style={{
              left: pct(pos.x, VW),
              top: pct(pos.y, VH),
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${NODE_CLS[state] ?? NODE_CLS.pending}`}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span
              className={`text-[9px] font-semibold uppercase tracking-wider transition-colors duration-300 ${LABEL_CLS[state] ?? LABEL_CLS.pending}`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
