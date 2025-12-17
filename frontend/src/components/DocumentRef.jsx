import { useState } from 'react'
import { FileText, ChevronRight, ChevronDown } from 'lucide-react'
import { docTypeBadge } from '@/utils/formatters'

export default function DocumentRef({ docRef, documents }) {
  const [open, setOpen] = useState(false)
  const doc = documents?.[docRef.doc_id]

  const section = doc?.sections?.find(s =>
    s.heading.toLowerCase().includes(docRef.section?.toLowerCase?.() ?? '')
  ) || doc?.sections?.[0]

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--surface-2)] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--surface)] transition-colors"
      >
        <FileText className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
        <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">
          {doc?.title || docRef.doc_id}
        </span>
        {doc?.type && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium shrink-0 ${docTypeBadge(doc.type)}`}>
            {doc.type}
          </span>
        )}
        {open
          ? <ChevronDown className="w-3 h-3 text-[var(--text-muted)] ml-auto shrink-0" />
          : <ChevronRight className="w-3 h-3 text-[var(--text-muted)] ml-auto shrink-0" />
        }
      </button>

      {open && section && (
        <div className="px-3 pb-3 pt-1 border-t border-[var(--border)]">
          <div className="text-[10px] text-blue-400 font-medium mb-1">§{section.heading}</div>
          <div className="text-[11px] text-[var(--text-muted)] leading-relaxed line-clamp-5">
            {section.content}
          </div>
          {doc?.source && (
            <div className="text-[9px] text-[var(--text-muted)]/60 mt-1.5">{doc.source}</div>
          )}
        </div>
      )}
    </div>
  )
}
