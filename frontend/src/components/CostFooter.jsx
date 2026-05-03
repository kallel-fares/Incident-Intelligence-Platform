import { RefreshCw } from 'lucide-react'
import { formatCost } from '@/utils/formatters'

export default function CostFooter({ briefingMeta, onRegenerate, regenerating }) {
  return (
    <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border)]">
      <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
        <span>
          <span className="text-[var(--text-primary)] font-medium">
            {briefingMeta?.tokens_in?.toLocaleString() ?? '—'}
          </span>{' '}tokens in
        </span>
        <span>
          <span className="text-[var(--text-primary)] font-medium">
            {briefingMeta?.tokens_out?.toLocaleString() ?? '—'}
          </span>{' '}tokens out
        </span>
        <span>
          <span className="text-green-400 font-medium">
            {formatCost(briefingMeta?.estimated_cost_usd)}
          </span>{' '}est. cost
        </span>
        {briefingMeta?.model_used && (
          <span className="text-[var(--text-muted)]">{briefingMeta.model_used}</span>
        )}
      </div>

      <button
        onClick={onRegenerate}
        disabled={regenerating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--border)] text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-slate-500 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
        {regenerating ? 'Generating…' : 'Regenerate Briefing'}
      </button>
    </div>
  )
}
