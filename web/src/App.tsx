import { useEffect, useState } from "react";
import { ExperimentTab } from "./components/ExperimentTab";
import { CasesTab } from "./components/CasesTab";
import { PAPER_URL } from "./constants";

type TabId = "cases" | "exp";

const TABS: { id: TabId; label: string; sub: string }[] = [
  { id: "cases", label: "Case Studies", sub: "From the paper" },
  { id: "exp", label: "Our Experiment", sub: "Results" },
];

const DEFAULT_CASE = 8;

/**
 * Routes: #cases/<n> (a case study), #exp or #exp/compare (results).
 * Old links #cs8 and #cs3 still work and open those cases.
 */
function parseHash(): { tab: TabId; caseN: number } {
  const h = window.location.hash.replace("#", "");
  if (h.startsWith("exp")) return { tab: "exp", caseN: DEFAULT_CASE };
  const legacy = h.match(/^cs(\d+)$/);
  const routed = h.match(/^cases\/(\d+)$/);
  const n = Number((legacy ?? routed)?.[1] ?? DEFAULT_CASE);
  return { tab: "cases", caseN: n >= 1 && n <= 16 ? n : DEFAULT_CASE };
}

export default function App() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (hash: string) => {
    window.location.hash = hash;
    setRoute(parseHash());
    window.scrollTo({ top: 0 });
  };

  // Keep the URL in sync with the selected case without adding history entries.
  const selectCase = (n: number) => {
    window.history.replaceState(null, "", `#cases/${n}`);
    setRoute({ tab: "cases", caseN: n });
  };

  return (
    <div className="app">
      <nav className="nav-top">
        <div className="brand" onClick={() => go(`cases/${DEFAULT_CASE}`)}>
          <span className="brand-mark">◉</span>
          <span className="brand-name">
            chaos<span className="brand-accent">lab</span>
          </span>
        </div>
        <div className="nav-title">
          <span className="nav-title-main">Agents of Chaos</span>
          <span className="nav-title-sub">Shapira, Wendler, Yen, et al. · arXiv 2602.20021 · CIS 7000 mini-project</span>
        </div>
        <a className="nav-paper-btn" href={PAPER_URL} target="_blank" rel="noreferrer">
          Read the paper
        </a>
      </nav>
      <nav className="nav-sub">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-tab ${route.tab === t.id ? "active" : ""}`}
            onClick={() => go(t.id === "cases" ? `cases/${route.caseN}` : "exp")}
          >
            <span className="nav-tab-sub">{t.sub}</span>
            <span className="nav-tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        <div hidden={route.tab !== "cases"}>
          <CasesTab active={route.tab === "cases"} caseN={route.caseN} onSelect={selectCase} onOpenResults={() => go("exp/compare")} />
        </div>
        {route.tab === "exp" && <ExperimentTab />}
      </main>

      <footer className="footer">
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0 }); }} className="footer-top">
          Back to top
        </a>
        <div className="footer-body">
          <span>Replays paraphrase the paper with fictional data. Experiment tools are simulated; no real systems are touched.</span>
          <span className="footer-links">
            <a href="https://github.com/prith27/chaos-lab" target="_blank" rel="noreferrer">
              Code and data on GitHub ↗
            </a>
            <a href={PAPER_URL} target="_blank" rel="noreferrer">
              Read the paper ↗
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
