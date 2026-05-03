import { useState, useEffect, useCallback } from 'react'
import { useFetch, postApi } from '@/hooks/useApi'

function SliderRow({ label, value, min, max, step = 1, onChange, format = v => v }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
        <span className="text-xs font-semibold text-[var(--text-primary)]">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #2e3248 ${((value - min) / (max - min)) * 100}%, #2e3248 100%)`
        }}
      />
    </div>
  )
}

function TokenInput({ label, sublabel, value, onChange }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs text-[var(--text-muted)]">{label}</div>
          <div className="text-[10px] text-[var(--text-muted)] opacity-60">{sublabel}</div>
        </div>
        <input
          type="number"
          value={value}
          min={500}
          step={500}
          onChange={e => onChange(Math.max(500, Number(e.target.value)))}
          className="w-28 text-right text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
        />
      </div>
    </div>
  )
}

export default function CostModelPage() {
  const { data: defaults } = useFetch('/api/cost-model')

  const [params, setParams] = useState({
    daily_alarm_volume: 200,
    tokens_input_realistic: 15000,
    tokens_output_realistic: 500,
    tokens_input_pessimistic: 80000,
    tokens_output_pessimistic: 1500,
  })

  const [projection, setProjection] = useState(null)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    if (defaults) setProjection(defaults)
  }, [defaults])

  const recalculate = useCallback(async (p) => {
    setCalculating(true)
    try {
      const result = await postApi('/api/cost-model/calculate', p)
      setProjection(result)
    } catch (e) {
      console.error(e)
    } finally {
      setCalculating(false)
    }
  }, [])

  const update = (key, val) => {
    const next = { ...params, [key]: val }
    setParams(next)
    recalculate(next)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-base font-semibold text-[var(--text-primary)]">Cost Projection Model</h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Monthly LLM spend for automated incident briefings. Adjust volume and token load to model your environment.
        </p>
      </div>

      {/* Inputs */}
      <div className="p-4 rounded border border-[var(--border)] bg-[var(--surface)] space-y-5">
        <SliderRow
          label="Daily Alarm Volume"
          value={params.daily_alarm_volume}
          min={50} max={2000} step={50}
          onChange={v => update('daily_alarm_volume', v)}
          format={v => v}
        />

        <div className="h-px bg-[var(--border)]" />

        <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
          Tokens per briefing
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <TokenInput
              label="Input tokens — realistic"
              sublabel="Summarized logs, key context"
              value={params.tokens_input_realistic}
              onChange={v => update('tokens_input_realistic', v)}
            />
            <TokenInput
              label="Output tokens — realistic"
              sublabel="Briefing response length"
              value={params.tokens_output_realistic}
              onChange={v => update('tokens_output_realistic', v)}
            />
          </div>
          <div className="space-y-3">
            <TokenInput
              label="Input tokens — pessimistic"
              sublabel="Raw logs + attached files"
              value={params.tokens_input_pessimistic}
              onChange={v => update('tokens_input_pessimistic', v)}
            />
            <TokenInput
              label="Output tokens — pessimistic"
              sublabel="Verbose briefing"
              value={params.tokens_output_pessimistic}
              onChange={v => update('tokens_output_pessimistic', v)}
            />
          </div>
        </div>
      </div>

      {/* Model comparison table */}
      {projection?.model_comparison && (
        <div className="p-4 rounded border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest">
              Model Comparison {calculating && <span className="normal-case font-normal">(recalculating…)</span>}
            </div>
            <div className="flex gap-4 text-[10px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-blue-500/30 border border-blue-500/50" />
                Realistic ({(params.tokens_input_realistic / 1000).toFixed(0)}k in / {params.tokens_output_realistic} out)
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-sm bg-amber-500/30 border border-amber-500/50" />
                Pessimistic ({(params.tokens_input_pessimistic / 1000).toFixed(0)}k in / {params.tokens_output_pessimistic} out)
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left text-[var(--text-muted)] font-medium pb-2 pr-4">Model</th>
                  <th className="text-right text-[var(--text-muted)] font-medium pb-2 pr-4">$/MTok in</th>
                  <th className="text-right text-[var(--text-muted)] font-medium pb-2 pr-4">$/MTok out</th>
                  <th className="text-right text-blue-400/70 font-medium pb-2 pr-4">Realistic/mo</th>
                  <th className="text-right text-amber-400/70 font-medium pb-2 pr-4">Pessimistic/mo</th>
                  <th className="text-right text-[var(--text-muted)] font-medium pb-2">$/briefing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {projection.model_comparison.map((m, i) => (
                  <tr key={i} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-[var(--text-primary)]">{m.model}</td>
                    <td className="py-2.5 pr-4 text-right text-[var(--text-muted)]">${m.price_in.toFixed(2)}</td>
                    <td className="py-2.5 pr-4 text-right text-[var(--text-muted)]">${m.price_out.toFixed(2)}</td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-blue-300">
                      ${m.monthly_cost_realistic.toFixed(2)}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-semibold text-amber-300">
                      ${m.monthly_cost_pessimistic.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right text-[var(--text-muted)] font-mono text-[10px]">
                      ${m.cost_per_briefing_realistic.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[10px] text-[var(--text-muted)]">
            Briefings/month: <span className="text-[var(--text-primary)] font-semibold">{(params.daily_alarm_volume * 30).toLocaleString()}</span>
            {' · '}
            Based on {params.daily_alarm_volume} alarms/day × 30 days
          </div>
        </div>
      )}
    </div>
  )
}
