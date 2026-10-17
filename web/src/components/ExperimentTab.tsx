import { useEffect, useState } from "react";
import type { Summary, Trial } from "../data/types";
import { exampleTrial, type Exp } from "../data/story";
import { Modal } from "./Modal";
import { TranscriptBrowser } from "./TranscriptBrowser";
import { HowWeTested } from "./exp/HowWeTested";
import { ModelResults } from "./exp/ModelResults";
import { CompareView } from "./exp/CompareView";
import { TrialReplay } from "./exp/TrialReplay";

type Sub = "how" | "model" | "compare";

const SUBS: { id: Sub; label: string }[] = [
  { id: "model", label: "Results by model" },
  { id: "compare", label: "Comparison" },
  { id: "how", label: "Method (full details)" },
];

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

type Overlay =
  | { kind: "read"; exp: Exp; cond: string; model: string; trial?: number }
  | { kind: "replay"; trial: Trial }
  | null;

export function ExperimentTab() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trials, setTrials] = useState<Trial[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [sub, setSub] = useState<Sub>("model");
  const [model, setModel] = useState("gpt-5-nano");
  const [overlay, setOverlay] = useState<Overlay>(null);

  useEffect(() => {
    Promise.all([fetchJson<Summary>("/data/summary.json"), fetchJson<Trial[]>("/data/trials.json")]).then(([s, t]) => {
      if (!s || !t) return setFailed(true);
      setSummary(s);
      setTrials(t);
    });
  }, []);

  const go = (s: Sub) => {
    setSub(s);
    document.querySelector(".exp-subnav")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const total = summary?.cells.reduce((a, c) => a + c.n, 0) ?? 960;

  return (
    <section className="page exp">
      <header className="exp-head">
        <h1>Our experiment: results</h1>
        <p>How often the paper's fake-owner (CS8) and SSN-leak (CS3) attacks worked when we repeated them across four models.</p>
        <p className="meta">
          {total} trials · 4 models · 8 conditions · 30 trials per condition
        </p>
      </header>

      <nav className="exp-subnav" role="tablist">
        {SUBS.map((s) => (
          <button key={s.id} role="tab" aria-selected={sub === s.id} className={`subnav-btn ${sub === s.id ? "on" : ""}`} onClick={() => go(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>

      {failed && (
        <div className="card pending">
          <h2>Results not loaded</h2>
          <p className="muted">
            Run <code>npm run sync-results</code> in <code>web/</code> after the experiment finishes.
          </p>
        </div>
      )}
      {!failed && (!summary || !trials) && <div className="card pending muted">Loading the experiment…</div>}

      {summary && trials && (
        <div className="fade-in" key={sub}>
          {sub === "how" && <HowWeTested summary={summary} onBack={() => go("model")} />}
          {sub === "model" && (
            <ModelResults
              summary={summary}
              trials={trials}
              model={model}
              onModel={setModel}
              onReplay={(e, cond) => {
                const t = exampleTrial(trials, e, cond, model);
                if (t) setOverlay({ kind: "replay", trial: t });
              }}
              onRead={(e, cond, trial) => setOverlay({ kind: "read", exp: e, cond, model, trial })}
            />
          )}
          {sub === "compare" && (
            <CompareView
              summary={summary}
              onRead={(e, cond, m) => setOverlay({ kind: "read", exp: e, cond, model: m })}
              onOpenModel={(m) => {
                setModel(m);
                go("model");
              }}
            />
          )}
        </div>
      )}

      {overlay && summary && (
        <Modal onClose={() => setOverlay(null)}>
          {overlay.kind === "replay" ? (
            <TrialReplay
              trial={overlay.trial}
              onClose={() => setOverlay(null)}
              onReadFull={() =>
                setOverlay({ kind: "read", exp: overlay.trial.experiment, cond: overlay.trial.condition, model: overlay.trial.model, trial: overlay.trial.trial })
              }
            />
          ) : (
            <TranscriptBrowser
              selection={{ experiment: overlay.exp, condition: overlay.cond, model: overlay.model }}
              trials={trials}
              conditions={summary.conditions}
              initialTrial={overlay.trial}
              onClose={() => setOverlay(null)}
            />
          )}
        </Modal>
      )}
    </section>
  );
}
