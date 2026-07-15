interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  valueFormatter?: (v: number) => string;
}

export function BarChart({ data, color = 'bg-brand-500', valueFormatter }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  if (!data.length) {
    return <p className="py-10 text-center text-sm text-slate-400">No data available</p>;
  }

  return (
    <div className="flex h-56 items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className={`w-full rounded-t-lg ${color} transition-all`}
              style={{ height: `${Math.max((d.value / max) * 100, 2)}%` }}
              title={valueFormatter ? valueFormatter(d.value) : String(d.value)}
            />
          </div>
          <span className="text-[11px] font-medium text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
