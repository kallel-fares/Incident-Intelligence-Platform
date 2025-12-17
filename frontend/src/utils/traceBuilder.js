// Pre-built vector index facts (docs are chunked + embedded offline, not at inference)
const INDEX = { totalSections: 52, model: 'text-embedding-3-small', dims: 1536 }

// Metadata filter candidates per scenario (equipment_tags + alarm_type_tags pre-filter)
const METADATA_FILTER = {
  A: { tags: ['CRAC', 'high_temperature'], candidates: 8 },
  B: { tags: ['PDU', 'voltage_fluctuation'], candidates: 6 },
  C: { tags: ['CRAC', 'chiller', 'high_temperature', 'compressor_fault'], candidates: 12 },
}

const RAG_RESULTS = {
  A: [
    { docId: 'MANUAL-CRAC-B07',   section: '4.1 Air Filter Location',  sim: '0.938' },
    { docId: 'SOP-COOL-012',      section: '4.3 Filter Replacement',   sim: '0.912' },
    { docId: 'SOP-REFRIG-001',    section: '2. Pressure Check',        sim: '0.847' },
    { docId: 'SOP-MAINT-FILTER',  section: 'Replacement Intervals',    sim: '0.821' },
    { docId: 'SOP-COOL-012',      section: '1. Initial Assessment',    sim: '0.793' },
  ],
  B: [
    { docId: 'SOP-PWR-MULTIMETER', section: 'Procedure',               sim: '0.941' },
    { docId: 'VB-2024-03',         section: 'Recommended Action',      sim: '0.929' },
    { docId: 'MANUAL-PDU-A03',     section: '5.2 Capacitor Replace',   sim: '0.897' },
    { docId: 'SOP-PWR-008',        section: '3. PDU Hardware Fault',   sim: '0.874' },
    { docId: 'VB-2024-03',         section: 'Affected Units',          sim: '0.851' },
  ],
  C: [
    { docId: 'SCHEMATIC-CHILLER',  section: 'Loop Assignments',        sim: '0.934' },
    { docId: 'SOP-CRIT-001',       section: 'Cascading Failure',       sim: '0.912' },
    { docId: 'SOP-COOL-012',       section: '5. Multi-Unit Correl.',   sim: '0.887' },
    { docId: 'PROC-LOADSHED-CD',   section: 'Trigger Criteria',        sim: '0.841' },
    { docId: 'SOP-CRIT-001',       section: 'Team Deployment',         sim: '0.823' },
  ],
}

const RAG_QUERIES = {
  A: 'CRAC discharge temperature gradual rise airflow restriction filter',
  B: 'PDU voltage sag intermittent capacitor degradation power conditioning',
  C: 'chiller loop failure upstream cascading thermal event multi-zone CRAC',
}

const BRIEFING_META = {
  A: { tokensIn: 2840, tokensOut: 720,  cost: '0.000430', latency: 831 },
  B: { tokensIn: 3210, tokensOut: 810,  cost: '0.000486', latency: 947 },
  C: { tokensIn: 4180, tokensOut: 960,  cost: '0.000593', latency: 1104 },
}

// Scenario-specific reasoning lines. Each key is a named inflection point.
// Values reference actual sensor readings, incident IDs, and equipment facts.
// `plan` returns the up-front planning thoughts shown before any tool call.
const REASONING = {
  A: {
    plan: () => [
      'received a high-temperature alarm on a CRAC unit. the alarm is climbing gradually rather than tripping — that profile already rules out a hard compressor failure but keeps two main hypotheses live: airflow restriction (clogged filter) and refrigerant deficit',
      'the discriminating signal between those two is humidity behavior. a restricted filter co-rises with zone humidity because cooling capacity drops while moisture removal stalls; a refrigerant fault loses cooling without affecting moisture. so I will need discharge temp and zone humidity side by side',
      'plan: equipment record first to anchor maintenance state and time-since-last-filter, then 2-hour telemetry at 5min resolution to characterize the rise rate, then incident history on this exact unit (priors are strongest when same equipment + same alarm type), then KB lookup for the corrective procedure',
    ],
    afterEquipment: (eq) =>
      `last maintenance ${eq?.last_maintenance ?? 'unknown'} — Zone B on monthly filter schedule; at 6 weeks elapsed, filter is at or past replacement interval`,
    afterTrend: (first, last, rate) =>
      `discharge temp ${first}°C → ${last}°C over 120min at ~${rate}°C/min — gradual rate rules out compressor failure; progressive restriction pattern`,
    afterAnomaly: () =>
      `zone humidity rising in parallel with discharge temp confirms restricted airflow, not refrigerant deficit — refrigerant fault wouldn't cause humidity change`,
    afterIncidents: (top) =>
      `${top?.incident_id} is a near-identical fingerprint on this exact unit — same gradual profile, resolved with FLT-2248 in 45min. raises filter hypothesis to high confidence`,
    afterRag: () =>
      `MANUAL-CRAC-B07 §4.1 and SOP-COOL-012 §4.3 cover the procedure (T-25 torx, spring-clip frame). SOP-REFRIG-001 retrieved as fallback if filter is visibly clean`,
    beforeLlm: () =>
      `primary: clogged filter (high). secondary: low refrigerant (low). humidity co-rise is the discriminating signal — filter-first diagnosis is correct`,
  },
  B: {
    plan: () => [
      'received a voltage fluctuation alarm on a PDU. three plausible causes here, each with different fixes and risk profiles: hardware degradation in the PDU itself (capacitor is the usual suspect), upstream supply variance, or a drifting voltage sensor reporting noise as fault',
      'each branch has a tell. hardware faults are localized to one unit; supply variance shows up on neighboring PDUs sharing the same upstream feed; sensor drift fails a multimeter cross-check. so the path through this is to gather evidence that discriminates these three before any physical action',
      'plan: equipment record first — APC vendor advisories segment by production batch, and a 2019 AP8853 sits inside an active capacitor batch advisory window. then telemetry to see the fluctuation profile, then a sibling PDU on the same feed to isolate hardware from supply, then incident history. multimeter cross-check is mandatory before opening any panel',
    ],
    afterEquipment: (eq) =>
      `APC AP8853 ${eq?.install_date?.slice(0, 4) ?? '2019'} — this production year falls within the VB-2024-03 capacitor batch advisory (Jan 2019 – Jun 2020)`,
    afterTrend: () =>
      `PDU-A-04 on the same upstream feed reads stable at 228V — eliminates supply fluctuation as cause; fault is isolated to PDU-A-03 hardware`,
    afterAnomaly: () =>
      `UPS battery temp +2°C is a consequence, not root cause — inverter compensating for voltage instability generates internal heat; confirms PDU issue is real, not sensor noise`,
    afterIncidents: (top, second) =>
      `${top?.incident_id} matches model and pattern (same APC AP8853 batch, voltage sag → capacitor). ${second?.incident_id} included deliberately as counter-hypothesis — that case was sensor drift, eliminated in 2min with multimeter`,
    afterRag: () =>
      `VB-2024-03 explicitly identifies this serial number (AP8853-2019-0447) as affected. SOP-PWR-MULTIMETER is mandatory first step — cannot open PDU until sensor drift is ruled out`,
    beforeLlm: () =>
      `two hypotheses: capacitor degradation (70% — VB-2024-03 + incident match) vs sensor drift (20% — INC-2024-0201). multimeter cross-check is the discriminating action; takes 2 minutes`,
  },
  C: {
    plan: () => [
      'received multiple cooling alarms across zones inside a tight time window. independent simultaneous failures of unrelated equipment are statistically rare — when several units degrade in parallel, the prior should sit on a shared upstream cause, not on coincidence',
      'the topology matters here. CRACs in this facility are partitioned across two chiller loops. if all alarming units sit on the same loop, that loop is the upstream signal; if the alarms span both loops, the per-unit hypothesis becomes plausible again and I treat each one independently',
      'plan: walk the standard per-unit drilldown — equipment record, telemetry, anomaly isolation — but watch the loop assignment of every alarming unit while doing it. if the pattern resolves to a single loop, pivot immediately to chiller-plant telemetry. do not treat the unit alarms as the root until the upstream possibility is excluded',
    ],
    afterEquipment: (eq) =>
      `${eq?.equipment_id ?? 'CRAC-C-02'} is on chiller Loop 2 / CHILLER-01 — checking if all alarming equipment shares this loop before drawing conclusions`,
    afterTrend: () =>
      `all alarming sensors are Loop 2 units (CRAC-C-02, CRAC-C-05, CRAC-D-01) — Zones A+B (Loop 1) nominal throughout. this is not a coincidence`,
    afterAnomaly: () =>
      `uniform degradation rate across all Loop 2 CRAC units in parallel — each unit is failing in the same direction. independent simultaneous failures of this nature are statistically implausible`,
    afterMultiZone: () =>
      `4 alarms in 6min, no load changes, all Loop 2 — probability of 4 independent equipment failures is negligible. must be a single upstream cause`,
    afterUpstream: () =>
      `chiller supply +7°C over 20min matches pump failure signature — gradual not instantaneous; compressor fault would drop faster. standby pump switchover is the first intervention`,
    afterIncidents: (top) =>
      `${top?.incident_id} is a direct playbook match: CHILLER-01 pump failure, same zones, same cascading pattern — resolution was standby pump activation, recovery in <15min`,
    afterRag: () =>
      `SCHEMATIC-CHILLER confirms Loop 2 zone assignments. SOP-CRIT-001 cascading protocol is the active procedure. PROC-LOADSHED-CD staged as 30-minute contingency`,
    beforeLlm: () =>
      `root cause confirmed: CHILLER-01 Loop 2 upstream failure. critical briefing note: do NOT restart individual CRAC units — they will fault again immediately until chilled water supply is restored`,
  },
}

function fmtTs(baseIso, offsetMs) {
  const d = new Date(new Date(baseIso).getTime() + offsetMs)
  const h  = d.getUTCHours().toString().padStart(2, '0')
  const m  = d.getUTCMinutes().toString().padStart(2, '0')
  const s  = d.getUTCSeconds().toString().padStart(2, '0')
  const ms = d.getUTCMilliseconds().toString().padStart(3, '0')
  return `${h}:${m}:${s}.${ms}`
}

export function buildTraceSteps({ alarm, sensors = [], incidents = [], equipment }) {
  const scenario   = alarm.scenario
  const ragResults = RAG_RESULTS[scenario] || RAG_RESULTS.A
  const ragQuery   = RAG_QUERIES[scenario] || RAG_QUERIES.A
  const meta       = BRIEFING_META[scenario] || BRIEFING_META.A
  const filter     = METADATA_FILTER[scenario] || METADATA_FILTER.A
  const reason     = REASONING[scenario] || REASONING.A

  const anomalous = sensors.filter(s => {
    const last = s.readings?.[s.readings.length - 1]
    return last != null && last.value > s.threshold
  })

  const totalReadings = sensors.reduce((sum, s) => sum + (s.readings?.length || 0), 0)

  const alarmTypes = new Set([alarm.type])
  const matchedIncidents = incidents
    .filter(inc =>
      inc.equipment?.includes(alarm.equipment_id) ||
      inc.zone?.includes(alarm.zone) ||
      inc.alarm_types?.some(t => alarmTypes.has(t))
    )
    .slice(0, 3)

  let cursor = 0
  let id = 0
  const steps = []

  // After a reasoning line, the next step must not appear before that line has
  // finished streaming — otherwise the streaming text snaps to full display.
  // 42ms/char comfortably covers the 55–150ms / 2–5 char chunk cadence used by
  // the streaming renderer, plus a 500ms read buffer.
  function push(type, text, addMs, opts = {}) {
    const prev = steps[steps.length - 1]
    if (prev && prev.type === 'reasoning') {
      const minMs = prev.text.length * 12 + 400
      if (addMs < minMs) addMs = minMs
    }
    cursor += addMs
    steps.push({ id: id++, timestamp: fmtTs(alarm.timestamp, cursor), type, text, delay: cursor, ...opts })
  }

  // ── 1. Header ─────────────────────────────────────────────────────────────
  const alarmCount = scenario === 'C' ? 4 : scenario === 'B' ? 2 : 1
  push('event', `INCIDENT CORRELATION ENGINE — SCENARIO ${scenario}`, 0)
  push('sub',   `${alarmCount} active alarm${alarmCount > 1 ? 's' : ''} · ${alarm.zone} · ${alarm.severity.toUpperCase()}`, 0)

  // ── 1b. Up-front planning — reason over the situation before any tool call ─
  const planLines = reason.plan?.() ?? []
  planLines.forEach((line, i) => {
    push('reasoning', line, i === 0 ? 900 : 0)
  })

  // ── 2. Equipment record ────────────────────────────────────────────────────
  push('tool',      `get_equipment_record(equipment_id="${alarm.equipment_id}")`, 600)
  const eqLine = equipment
    ? `${equipment.name} (${equipment.model}) · ${equipment.zone} · installed ${equipment.install_date?.slice(0, 4)} · last maint. ${equipment.last_maintenance}`
    : `${alarm.equipment_id} · record retrieved`
  push('result',    eqLine, 1300)
  push('reasoning', reason.afterEquipment(equipment), 750)

  // ── 3. Telemetry ──────────────────────────────────────────────────────────
  push('tool',   `query_telemetry(equipment_id="${alarm.equipment_id}", window="2h", resolution="5min")`, 600)
  push('result', `${sensors.length} sensor stream${sensors.length !== 1 ? 's' : ''} retrieved · ${totalReadings} data points`, 1500)

  // ── 4. Anomaly isolation ──────────────────────────────────────────────────
  push('analysis', 'isolating anomalous trends across sensor streams...', 700)
  anomalous.forEach((s, i) => {
    const first = s.readings?.[0]?.value ?? 0
    const last  = s.readings?.[s.readings.length - 1]?.value ?? 0
    const delta = (last - first).toFixed(1)
    const mins  = Math.round((s.readings?.length || 1) * 5)
    const rate  = mins > 0 ? (Math.abs(delta) / mins).toFixed(3) : '?'
    const pct   = (((last - s.threshold) / s.threshold) * 100).toFixed(1)
    push(
      'anomaly',
      `${s.sensor_id}  ${last}${s.unit}  ⚠  +${pct}% over threshold  Δ${delta > 0 ? '+' : ''}${delta} over ${mins}min  (${rate}${s.unit}/min)`,
      i === 0 ? 1000 : 400,
      { highlight: true }
    )
  })

  // Reasoning after trend analysis — data-driven per scenario
  const firstSensor = anomalous[0]
  if (firstSensor) {
    const first = firstSensor.readings?.[0]?.value ?? 0
    const last  = firstSensor.readings?.[firstSensor.readings.length - 1]?.value ?? 0
    const mins  = Math.round((firstSensor.readings?.length || 1) * 5)
    const rate  = mins > 0 ? ((last - first) / mins).toFixed(3) : '?'
    push('reasoning', reason.afterTrend?.(first.toFixed(1), last.toFixed(1), rate) ?? '', 700)
  }
  push('reasoning', reason.afterAnomaly?.() ?? '', 0)

  // ── 4b. Scenario C — cross-zone upstream correlation ──────────────────────
  if (scenario === 'C') {
    push('analysis', 'multi-zone pattern detected — 4 alarms within 6min window — expanding correlation scope', 800, { highlight: true })
    push('reasoning', reason.afterMultiZone(), 700)
    push('tool',     'query_telemetry(scope="chiller_plant", loop=2, include_upstream=true)', 600)
    push('result',   'UPSTREAM: CHILLER-01 supply temp 7°C → 14°C over 20min  ·  loop flow rate declining', 1800, { upstream: true })
    push('reasoning', reason.afterUpstream(), 700, { upstream: true })
    push('result',   'Zones A+B nominal (Loop 1 / CHILLER-02 unaffected)  ·  individual CRAC alarms are symptoms', 600, { upstream: true })
  }

  // ── 5. Incident history search ────────────────────────────────────────────
  push('tool', `search_incidents(equipment="${alarm.equipment_id}", zones=[${alarm.zone}], alarm_types=[${alarm.type}], limit=5)`, 800)
  if (matchedIncidents.length > 0) {
    push('result', `${matchedIncidents.length} historical match${matchedIncidents.length !== 1 ? 'es' : ''} · ranked by equipment + zone + alarm-type overlap`, 1400)
    matchedIncidents.slice(0, 2).forEach((inc, i) => {
      const title = inc.title.length > 54 ? inc.title.slice(0, 54) + '…' : inc.title
      push('sub', `[${i + 1}] ${inc.incident_id}  score:0.${94 - i * 23}  "${title}"`, i === 0 ? 350 : 250)
    })
    push('reasoning', reason.afterIncidents(matchedIncidents[0], matchedIncidents[1]), 700)
  } else {
    push('result',    'no direct equipment match — broadening to zone + alarm-type search', 1400)
  }

  // ── 6. Knowledge base retrieval (pre-built vector index) ──────────────────
  push('rag',    `metadata_filter(equipment_tags=${JSON.stringify(filter.tags)})`, 800)
  push('result', `${filter.candidates} candidate sections matched  ·  ${INDEX.totalSections} total in offline index`, 1100)
  push('rag',    `embed_query(query="${ragQuery}", model="${INDEX.model}")`, 700)
  push('result', `query → ${INDEX.dims}-dim dense vector  ·  12ms`, 950)
  push('rag',    `cosine_similarity_search(candidates=${filter.candidates}, top_k=5)`, 600)
  ragResults.forEach((r, i) => {
    const docPad = r.docId.padEnd(22)
    const secPad = r.section.length > 28 ? r.section.slice(0, 28) : r.section.padEnd(28)
    push('result', `[${i + 1}] ${docPad} §${secPad}  sim: ${r.sim}`, i === 0 ? 1300 : 320)
  })
  push('reasoning', reason.afterRag(), 700)

  // ── 7. Context assembly ───────────────────────────────────────────────────
  push(
    'context',
    `assembling prompt context  ${meta.tokensIn.toLocaleString()} tokens  (${ragResults.length} doc sections · ${sensors.length} sensor streams · ${matchedIncidents.length} incident records)`,
    700
  )

  // ── 8. LLM briefing generation ────────────────────────────────────────────
  push('reasoning', reason.beforeLlm(), 700)
  push('tool',      'generate_briefing(model="gpt-5-nano", reasoning={effort:"low"}, max_tokens=1024)', 600)
  push('complete',  `BRIEFING COMPLETE  ${meta.tokensOut} tok out  ·  $${meta.cost}  ·  ${meta.latency}ms`, 1800, { highlight: true })

  return steps
}
