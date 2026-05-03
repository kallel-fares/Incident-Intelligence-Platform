import {
  ResponsiveContainer, LineChart, Line, ReferenceLine,
  Tooltip, YAxis
} from 'recharts'

export default function SensorChart({ sensor }) {
  if (!sensor?.readings?.length) return null

  const data = sensor.readings.map(r => ({
    t: r.timestamp.slice(11, 16),
    v: r.value,
  }))

  const lastVal = data[data.length - 1]?.v
  const isAnomaly = lastVal > sensor.threshold

  const CustomDot = (props) => {
    const { cx, cy, index } = props
    if (index !== data.length - 1) return null
    return <circle cx={cx} cy={cy} r={4} fill={isAnomaly ? '#ef4444' : '#22c55e'} stroke="none" />
  }

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--surface-2)] p-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-medium text-[var(--text-muted)] truncate">
          {sensor.label}
        </span>
        <span className={`text-[11px] font-semibold ${isAnomaly ? 'text-red-400' : 'text-green-400'}`}>
          {lastVal}{sensor.unit}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={60}>
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <YAxis domain={['auto', 'auto']} hide />
          <ReferenceLine y={sensor.threshold} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
          <Tooltip
            contentStyle={{
              background: '#1a1d27', border: '1px solid #2e3248',
              borderRadius: 4, fontSize: 10, padding: '2px 6px',
            }}
            itemStyle={{ color: '#e8eaf6' }}
            labelStyle={{ color: '#7b83a6', fontSize: 9 }}
            formatter={(v) => [`${v}${sensor.unit}`, '']}
          />
          <Line
            type="monotone"
            dataKey="v"
            stroke={isAnomaly ? '#ef4444' : '#3b82f6'}
            strokeWidth={1.5}
            dot={<CustomDot />}
            activeDot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-[9px] text-[var(--text-muted)] mt-0.5">
        threshold: {sensor.threshold}{sensor.unit}
      </div>
    </div>
  )
}
