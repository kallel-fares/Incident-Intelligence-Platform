export function severityColor(severity) {
  switch (severity) {
    case 'critical': return 'text-red-400 border-red-500/40 bg-red-500/10'
    case 'warning':  return 'text-amber-400 border-amber-500/40 bg-amber-500/10'
    case 'info':     return 'text-blue-400 border-blue-500/40 bg-blue-500/10'
    default:         return 'text-slate-400 border-slate-500/40 bg-slate-500/10'
  }
}

export function severityDot(severity) {
  switch (severity) {
    case 'critical': return 'bg-red-500'
    case 'warning':  return 'bg-amber-400'
    case 'info':     return 'bg-blue-400'
    default:         return 'bg-slate-400'
  }
}

export function severityLabel(severity) {
  switch (severity) {
    case 'critical': return 'P1 Critical'
    case 'warning':  return 'P3 Warning'
    case 'info':     return 'P4 Info'
    default:         return severity
  }
}

export function confidenceColor(confidence) {
  switch ((confidence || '').toLowerCase()) {
    case 'high':   return 'text-red-400 bg-red-500/10 border-red-500/30'
    case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    case 'low':    return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
    default:       return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
  }
}

export function formatTimestamp(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('en-GB', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  })
}

export function formatCost(usd) {
  if (usd === undefined || usd === null) return '$0.000'
  if (usd < 0.001) return `$${(usd * 1000).toFixed(3)}m`
  return `$${usd.toFixed(4)}`
}

export function docTypeBadge(type) {
  switch (type) {
    case 'SOP':       return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    case 'Manual':    return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    case 'Bulletin':  return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    case 'Schematic': return 'bg-teal-500/20 text-teal-300 border-teal-500/30'
    case 'Procedure': return 'bg-green-500/20 text-green-300 border-green-500/30'
    default:          return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  }
}
