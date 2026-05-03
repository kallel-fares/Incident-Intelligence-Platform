// Derives the 5-phase tool pipeline from a trace step array.
// Returns `startAt` (ms when the agent dispatches the call) and
// `resultAt` (ms when the result arrives back) for each tool phase.
// Synthesize exposes `startAt` + `endAt` (trace complete).
// Pure & scenario-agnostic.
//
// Sensors matcher intentionally excludes the scenario-C secondary
// query_telemetry(scope="chiller_plant"...) — that belongs to the same
// Sensors phase, just with widened scope.
export function derivePhases(steps) {
  if (!Array.isArray(steps) || steps.length === 0) return []

  const find      = pred => steps.find(pred)
  const findAfter = (delay, pred) => steps.find(s => s.delay > delay && pred(s))

  const equipment  = find(s => s.type === 'tool' && s.text.startsWith('get_equipment_record'))
  const sensors    = find(s => s.type === 'tool' && s.text.startsWith('query_telemetry(equipment_id'))
  const incidents  = find(s => s.type === 'tool' && s.text.startsWith('search_incidents'))
  const documents  = find(s => s.type === 'rag')
  const synthesize = find(s => s.type === 'context')
  const finish     = find(s => s.type === 'complete')

  const isResult = s => s.type === 'result'

  return [
    {
      key: 'equipment',  label: 'Equipment',
      startAt:  equipment?.delay  ?? null,
      resultAt: equipment  ? (findAfter(equipment.delay,  isResult)?.delay ?? null) : null,
    },
    {
      key: 'sensors',    label: 'Sensors',
      startAt:  sensors?.delay    ?? null,
      resultAt: sensors    ? (findAfter(sensors.delay,    isResult)?.delay ?? null) : null,
    },
    {
      key: 'incidents',  label: 'Incidents',
      startAt:  incidents?.delay  ?? null,
      resultAt: incidents  ? (findAfter(incidents.delay,  isResult)?.delay ?? null) : null,
    },
    {
      key: 'documents',  label: 'Documents',
      startAt:  documents?.delay  ?? null,
      resultAt: documents  ? (findAfter(documents.delay,  isResult)?.delay ?? null) : null,
    },
    {
      key: 'synthesize', label: 'Synthesize',
      startAt:  synthesize?.delay ?? null,
      endAt:    finish?.delay     ?? null,
    },
  ]
}
