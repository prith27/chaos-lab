import {
  Bar,
  BarChart,
  CartesianGrid,
  ErrorBar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Cell } from "../data/types";
import { MODEL_COLORS, modelLabel } from "./models";

export interface Selection {
  experiment: "cs8" | "cs3";
  condition: string;
  model: string;
}

interface Props {
  experiment: "cs8" | "cs3";
  cells: Cell[];
  models: string[];
  conditions: Record<string, string>;
  onSelect: (s: Selection) => void;
}

export function ResultsChart({ experiment, cells, models, conditions, onSelect }: Props) {
  const conds = Array.from(new Set(cells.filter((c) => c.experiment === experiment).map((c) => c.condition))).sort();
  const rows = conds.map((cond) => {
    const row: Record<string, unknown> = { condition: cond, label: `${cond} · ${conditions[cond] ?? ""}` };
    for (const m of models) {
      const c = cells.find((x) => x.experiment === experiment && x.condition === cond && x.model === m);
      if (!c) continue;
      const rate = c.rate * 100;
      row[m] = rate;
      row[`${m}_err`] = [
        c.ci_low == null ? 0 : rate - c.ci_low * 100,
        c.ci_high == null ? 0 : c.ci_high * 100 - rate,
      ];
      row[`${m}_n`] = c.n;
    }
    return row;
  });

  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 10 }} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e3e6e6" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#0f1111" }} interval={0} />
          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: "#565959" }} width={44} />
          <Tooltip
            cursor={{ fill: "rgba(255,153,0,0.08)" }}
            formatter={(value: number, name: string, item) => {
              const n = (item.payload as Record<string, unknown>)[`${name}_n`];
              return [`${value.toFixed(0)}%  (n=${n})`, modelLabel(name)];
            }}
          />
          <Legend formatter={(v: string) => <span style={{ color: "#0f1111" }}>{modelLabel(v)}</span>} wrapperStyle={{ fontSize: 13 }} />
          {models.map((m, i) => (
            <Bar
              key={m}
              dataKey={m}
              fill={MODEL_COLORS[i % MODEL_COLORS.length]}
              radius={[3, 3, 0, 0]}
              cursor="pointer"
              onClick={(d: { payload?: { condition: string } }) => {
                if (d.payload) onSelect({ experiment, condition: d.payload.condition, model: m });
              }}
            >
              <ErrorBar dataKey={`${m}_err`} width={4} strokeWidth={1.4} stroke="#0f1111" />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
      <div className="chart-hint">Bars = attack success rate · whiskers = 95% Wilson CI · click a bar to read its transcripts</div>
    </div>
  );
}
