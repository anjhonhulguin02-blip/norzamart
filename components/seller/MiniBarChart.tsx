interface DataPoint {
  label: string;
  revenue: number;
}

export default function MiniBarChart({ data }: { data: DataPoint[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d, i) => {
        const heightPct = (d.revenue / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-ink/60">
              {d.revenue > 0 ? `₱${d.revenue.toFixed(0)}` : ''}
            </span>
            <div className="w-full bg-ink/5 rounded-t-md relative h-32 flex items-end overflow-hidden">
              <div
                className="w-full bg-basil rounded-t-md transition-all duration-500"
                style={{ height: `${heightPct}%`, minHeight: d.revenue > 0 ? '4px' : '0' }}
              />
            </div>
            <span className="text-[10px] text-ink/40 font-semibold">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}