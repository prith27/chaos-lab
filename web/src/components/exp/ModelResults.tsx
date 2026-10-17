import type { Summary, Trial } from "../../data/types";
import { EXPERIMENTS, MODELS, SETUPS, cell, modelInfo, neverOpened, quoteTrials, resultLines, rowText, type Exp } from "../../data/story";
import { Highlight } from "../Highlight";

interface Props {
  summary: Summary;
  trials: Trial[];
  model: string;
  onModel: (m: string) => void;
  onReplay: (exp: Exp, cond: string) => void;
  onRead: (exp: Exp, cond: string, trial?: number) => void;
}

/** Shortens a reply, centred on the first leaked or redacted value so the relevant part is visible. */
function excerpt(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const hit = t.search(/123[- ]?45[- ]?6789|\[REDACTED|surgery|oxycodone/i);
  if (hit > n - 60) {
    const start = Math.max(0, hit - 90);
    return `…${t.slice(start, start + n)}…`;
  }
  return `${t.slice(0, n)}…`;
}

export function ModelResults({ summary, trials, model, onModel, onReplay, onRead }: Props) {
  const info = modelInfo(model)!;

  return (
    <div className="doc">
      <div className="panel model-bar">
        <div className="model-select-wrap">
          <label htmlFor="model-select">Model</label>
          <select id="model-select" className="model-select" value={model} onChange={(e) => onModel(e.target.value)}>
            <optgroup label="Commercial (OpenAI API)">
              {MODELS.filter((m) => m.kind === "api").map((m) => (
                <option key={m.key} value={m.key}>
                  {m.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Open-weight (run locally)">
              {MODELS.filter((m) => m.kind === "local").map((m) => (
                <option key={m.key} value={m.key}>
                  {m.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="model-facts">
          <h2>{info.name}</h2>
          <p className="muted">
            {info.maker}, {info.size}. Ran on {info.where}.
          </p>
        </div>
      </div>

      {(["cs8", "cs3"] as Exp[]).map((e, ei) => {
        const meta = EXPERIMENTS[e];
        const lines = resultLines(summary, e, model);
        const q = quoteTrials(trials, e, model);
        const name = (cond: string) => SETUPS[e].find((s) => s.id === cond)?.name ?? cond;
        return (
          <section key={e} className="panel">
            <h2>
              {meta.caseRef}: {meta.title}
            </h2>
            <p className="muted">{meta.question}</p>
            <p className="legend">
              {SETUPS[e].map((s, i) => (
                <span key={s.id}>
                  <b className="mono">{s.id}</b> {s.short}
                  {i < SETUPS[e].length - 1 ? " · " : ""}
                </span>
              ))}
            </p>

            <div className="result-grid">
              <figure className="fig bars">
                {SETUPS[e].map((s) => {
                  const c = cell(summary, s.id, model);
                  const pct = c ? Math.round(c.rate * 100) : 0;
                  const skipped = neverOpened(c, s.id);
                  return (
                    <div key={s.id} className="bar-row">
                      <div className="bar-label">
                        <span className="mono muted">{s.id}</span> {s.name}
                      </div>
                      <div className="bar-mid">
                        <div className={`bar-track ${skipped ? "bar-skip" : ""}`}>
                          <div className="bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="bar-note">{rowText(e, s.id, c)}</span>
                      </div>
                      <div className={`bar-pct ${skipped ? "p-skip" : pct === 0 ? "p-good" : "p-bad"}`}>{skipped ? "n/a" : `${pct}%`}</div>
                      <button className="btn-small" onClick={() => onReplay(e, s.id)}>
                        Replay a trial
                      </button>
                    </div>
                  );
                })}
                <figcaption>
                  <b>Figure {ei + 1}.</b> Share of trials {meta.metric}, {info.name}. 30 trials per condition.
                </figcaption>
              </figure>

              <aside className="summary-box">
                <h3>Summary</h3>
                <ul>
                  {lines.map((l) => (
                    <li key={l.text} className={`sl sl-${l.tone}`}>
                      {l.text}
                    </li>
                  ))}
                </ul>
              </aside>
            </div>

            <h3 className="sub-h">Example responses</h3>
            <p className="muted small">
              The first recorded trial where the attack worked and the first where it didn't, looking in {q.order.join(", ")} in that order.
            </p>
            <div className="quote-grid">
              {[
                { t: q.worked, label: "Attack worked", cls: "q-bad" },
                { t: q.failed, label: "Attack failed", cls: "q-good" },
              ].map(({ t, label, cls }) => (
                <div key={label} className={`quote ${cls}`}>
                  <div className="quote-label">
                    {label}
                    {t && (
                      <span className="quote-from">
                        {" "}
                        · {t.condition} {name(t.condition)}, trial {t.trial + 1}
                      </span>
                    )}
                  </div>
                  {t ? (
                    <>
                      <div className="quote-tools">
                        {((t.details as { tool_calls?: { name: string }[] }).tool_calls ?? [])
                          .filter((c) => c.name !== "send_reply")
                          .slice(0, 3)
                          .map((c, i) => (
                            <code key={i} className="quote-tool">
                              {c.name}()
                            </code>
                          ))}
                      </div>
                      <blockquote>
                        <Highlight text={excerpt(t.outgoing_text || "(no text reply)", 230)} />
                      </blockquote>
                      <button className="link-btn" onClick={() => onRead(e, t.condition, t.trial)}>
                        Read the full transcript
                      </button>
                    </>
                  ) : (
                    <p className="muted">Didn't happen in any condition.</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
