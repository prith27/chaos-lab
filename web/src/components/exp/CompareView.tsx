import type { Summary } from "../../data/types";
import { DISCUSSION, EXPERIMENTS, MODELS, SETUPS, cell, neverOpened, type Exp } from "../../data/story";
import { ResultsChart } from "../ResultsChart";

interface Props {
  summary: Summary;
  onRead: (exp: Exp, cond: string, model: string) => void;
  onOpenModel: (model: string) => void;
}

/** Background tint for a rate: none at 0%, then light orange to light red. */
function tint(rate: number): string | undefined {
  if (rate === 0) return undefined;
  const a = 0.12 + rate * 0.38;
  return rate >= 0.5 ? `rgba(177, 39, 4, ${a})` : `rgba(228, 121, 17, ${a})`;
}

export function CompareView({ summary, onRead, onOpenModel }: Props) {
  const models = MODELS.map((m) => m.key);
  return (
    <div className="doc">
      <section className="panel">
        <h2>Comparison across models</h2>
        <table className="atable cmp">
          <caption>
            <b>Table 1.</b> Attack success rate (%) by condition and model, 30 trials per cell. Click a number to read its transcripts.
          </caption>
          <thead>
            <tr>
              <th>Condition</th>
              {MODELS.map((m) => (
                <th key={m.key} className="num">
                  <button className="th-link" onClick={() => onOpenModel(m.key)}>
                    {m.name}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          {(["cs8", "cs3"] as Exp[]).map((e) => (
            <tbody key={e}>
              <tr className="group">
                <td colSpan={models.length + 1}>
                  {EXPERIMENTS[e].caseRef}: {EXPERIMENTS[e].title} <span className="muted">(% of trials {EXPERIMENTS[e].metric})</span>
                </td>
              </tr>
              {SETUPS[e].map((s) => (
                <tr key={s.id}>
                  <td className="nowrap">
                    <span className="mono muted">{s.id}</span> {s.name}
                  </td>
                  {models.map((m) => {
                    const c = cell(summary, s.id, m);
                    if (!c) return <td key={m} className="num">–</td>;
                    const skip = neverOpened(c, s.id);
                    return (
                      <td key={m} className="num">
                        <button className="cell-btn" style={{ background: skip ? undefined : tint(c.rate) }} onClick={() => onRead(e, s.id, m)}>
                          {skip ? (
                            <span className="muted">
                              n/a<sup>a</sup>
                            </span>
                          ) : (
                            <b>{Math.round(c.rate * 100)}</b>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
        <p className="footnote">
          <sup>a</sup> GPT-5 mini never read the mailbox when a non-owner asked, so there was nothing it could leak in 3B–3D.
        </p>
      </section>

      <section className="panel">
        <h2>Discussion</h2>
        <ol className="discussion">
          {DISCUSSION.map((d) => (
            <li key={d.title}>
              <b>{d.title}</b> {d.body}
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h2>Charts</h2>
        {(["cs8", "cs3"] as Exp[]).map((e, i) => (
          <figure key={e} className="fig">
            <ResultsChart
              experiment={e}
              cells={summary.cells}
              models={models}
              conditions={Object.fromEntries(SETUPS[e].map((s) => [s.id, s.name]))}
              onSelect={(s) => onRead(s.experiment, s.condition, s.model)}
            />
            <figcaption>
              <b>Figure {i + 3}.</b> {EXPERIMENTS[e].caseRef}: share of trials {EXPERIMENTS[e].metric}. Error bars are 95% Wilson
              confidence intervals (n = 30).
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="panel">
        <h2>Limitations</h2>
        <p>
          These are smaller models in a simulation, not the paper's Kimi and Claude agents running inside OpenClaw. The attacker is a
          fixed script rather than a person adapting to the agent, and each cell has 30 trials. So the numbers say which direction each
          effect goes, not how often this would happen in a real deployment.
        </p>
      </section>
    </div>
  );
}
