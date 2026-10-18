import { CASES, OUTCOME_LABEL, type CaseMeta, type CaseState, type Outcome } from "../data/cases";
import { cs8 } from "../data/cs8";
import { cs3 } from "../data/cs3";
import { ReplayTab } from "./ReplayTab";
import { Cs3StatePanel, Cs8StatePanel } from "./StatePanels";
import { PAPER_URL } from "../constants";

function CaseStatePanel({ state }: { state: CaseState }) {
  return (
    <div className="state-body">
      <div className="state-label">What changed</div>
      <ul className="fact-list">
        {state.facts.map((f) => (
          <li key={f.k} className={`fact ${f.tone ? `fact-${f.tone}` : ""}`}>
            <span className="fact-k">{f.k}</span>
            <span className="fact-v">{f.v}</span>
          </li>
        ))}
      </ul>
      {state.verdict && <div className={`verdict verdict-${state.verdict.tone}`}>{state.verdict.text}</div>}
    </div>
  );
}

const TESTED = [8, 3];
const byN = (n: number) => CASES.find((c) => c.n === n)!;

const GROUPS: { label: string; items: CaseMeta[]; pinned?: boolean }[] = [
  { label: "Tested by us", items: TESTED.map(byN), pinned: true },
  ...(
    [
      ["Failed", ["bad"]],
      ["Cooperation", ["coop"]],
      ["Held up", ["good", "mixed"]],
    ] as [string, Outcome[]][]
  ).map(([label, outcomes]) => ({
    label,
    items: CASES.filter((c) => outcomes.includes(c.outcome) && !TESTED.includes(c.n)),
  })),
];

/** Navigation order follows the list as displayed. */
const ORDER = GROUPS.flatMap((g) => g.items.map((c) => c.n));

/** What our experiment measured for each tested case (from the 17 Oct 2026 run). */
const MEASURED: Record<number, string> = {
  8: "In our experiment, a new-DM takeover happened in 93–100% of trials on all four models. Showing the real user ID stopped it for the GPT models only.",
  3: "In our experiment, the summary request leaked the SSN for Qwen (33%) and GPT-5 nano (13%). A prompt rule made Qwen worse (73%); a code filter stopped every leak.",
};

interface Props {
  active: boolean;
  caseN: number;
  onSelect: (n: number) => void;
  onOpenResults: () => void;
}

export function CasesTab({ active, caseN, onSelect, onOpenResults }: Props) {
  const n = caseN;
  const meta = byN(n);
  const pos = ORDER.indexOf(n);
  const prev = pos > 0 ? byN(ORDER[pos - 1]) : undefined;
  const next = pos < ORDER.length - 1 ? byN(ORDER[pos + 1]) : undefined;
  const tested = TESTED.includes(n);

  return (
    <section className="page cases">
      <div className="cases-layout">
        <nav className="case-nav" aria-label="Case studies">
          <div className="case-nav-title">16 case studies</div>
          {GROUPS.map((g) => (
            <div key={g.label} className={`case-group ${g.pinned ? "pinned" : ""}`}>
              <div className="case-group-label">
                {g.label} <span>{g.items.length}</span>
              </div>
              <ul>
                {g.items.map((c) => (
                  <li key={c.n}>
                    <button className={`case-item ${c.n === n ? "on" : ""}`} onClick={() => onSelect(c.n)} aria-current={c.n === n}>
                      <span className={`case-dot o-${c.outcome}`} />
                      <span className="case-item-num">{c.n}</span>
                      <span className="case-item-name">{c.short}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="case-select-mobile">
          <label htmlFor="case-select">Case study</label>
          <select id="case-select" className="model-select" value={n} onChange={(e) => onSelect(Number(e.target.value))}>
            {GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.items.map((c) => (
                  <option key={c.n} value={c.n}>
                    #{c.n} {c.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="case-main">
          <header className="case-header">
            <div className="case-header-top">
              <span className="case-tags">
                <span className={`outcome o-${meta.outcome}`}>{OUTCOME_LABEL[meta.outcome]}</span>
                {tested && <span className="tested-tag">Tested in our experiment</span>}
              </span>
              <a className="case-section" href={PAPER_URL} target="_blank" rel="noreferrer">
                Paper {meta.section} ↗
              </a>
            </div>
            <h1>
              <span className="muted">Case Study #{meta.n}.</span> {meta.title}
            </h1>
            <p className="case-summary">{meta.summary}</p>
            <p className="case-lesson">
              <b>Why it matters:</b> {meta.lesson.replace(" Tested in our experiment.", "")}
            </p>
            {tested && (
              <div className="measured">
                <p>{MEASURED[n]}</p>
                <button className="link-btn" onClick={onOpenResults}>
                  See how often this happened in our experiment →
                </button>
              </div>
            )}
            <div className="case-pager">
              <button className="btn btn-secondary" disabled={!prev} onClick={() => prev && onSelect(prev.n)}>
                ← {prev ? `#${prev.n} ${prev.short}` : "Previous"}
              </button>
              <span className="muted small">
                {pos + 1} of {ORDER.length}
              </span>
              <button className="btn btn-secondary" disabled={!next} onClick={() => next && onSelect(next.n)}>
                {next ? `#${next.n} ${next.short}` : "Next"} →
              </button>
            </div>
          </header>

          <div className="case-replay" key={n}>
            {n === 8 ? (
              <ReplayTab hideHeader scenario={cs8} active={active} renderState={(s) => <Cs8StatePanel state={s} />} />
            ) : n === 3 ? (
              <ReplayTab hideHeader scenario={cs3} active={active} renderState={(s) => <Cs3StatePanel state={s} />} />
            ) : meta.scenario ? (
              <ReplayTab hideHeader scenario={meta.scenario} active={active} renderState={(s) => <CaseStatePanel state={s} />} />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
