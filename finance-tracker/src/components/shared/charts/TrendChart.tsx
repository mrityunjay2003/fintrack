import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/utils";

interface TrendChartProps {
  data: any[];
  xKey: string;
  series: { key: string; colorHex: string }[];
}

export function TrendChart({ data, xKey, series }: TrendChartProps) {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.colorHex} stopOpacity={0.2} />
                <stop offset="95%" stopColor={s.colorHex} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <XAxis 
            dataKey={xKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(val) => `₹${val / 100000}k`} // Quick format for axis
            dx={-10}
          />
          <Tooltip 
            formatter={(val: number) => formatMoney(val)}
            contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--foreground))' }}
          />
          {series.map((s) => (
            <Area 
              key={s.key}
              type="monotone" 
              dataKey={s.key} 
              stroke={s.colorHex} 
              fillOpacity={1} 
              fill={`url(#fill-${s.key})`} 
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
