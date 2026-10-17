import { useEffect, useState } from "react";
import { cs8 } from "./data/cs8";
import { cs3 } from "./data/cs3";
import { ReplayTab } from "./components/ReplayTab";
import { Cs3StatePanel, Cs8StatePanel } from "./components/StatePanels";
import { ExperimentTab } from "./components/ExperimentTab";
import { PAPER_URL } from "./constants";

type TabId = "cs8" | "cs3" | "exp";

const TABS: { id: TabId; label: string; sub: string }[] = [
  { id: "cs8", label: "The Fake Owner", sub: "Case Study #8" },
  { id: "cs3", label: "The SSN Leak", sub: "Case Study #3" },
  { id: "exp", label: "Our Experiment", sub: "Results" },
];

function tabFromHash(): TabId {
  const h = window.location.hash.replace("#", "");
  return h === "cs3" || h === "exp" ? h : "cs8";
}

export default function App() {
  const [tab, setTab] = useState<TabId>(tabFromHash);

  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (t: TabId) => {
    window.location.hash = t;
    setTab(t);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="app">
      <nav className="nav-top">
        <div className="brand" onClick={() => go("cs8")}>
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
          <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} onClick={() => go(t.id)}>
            <span className="nav-tab-sub">{t.sub}</span>
            <span className="nav-tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        <div hidden={tab !== "cs8"}>
          <ReplayTab scenario={cs8} active={tab === "cs8"} renderState={(s) => <Cs8StatePanel state={s} />} />
        </div>
        <div hidden={tab !== "cs3"}>
          <ReplayTab scenario={cs3} active={tab === "cs3"} renderState={(s) => <Cs3StatePanel state={s} />} />
        </div>
        {tab === "exp" && <ExperimentTab />}
      </main>

      <footer className="footer">
        <a href="#cs8" onClick={() => window.scrollTo({ top: 0 })} className="footer-top">
          Back to top
        </a>
        <div className="footer-body">
          <span>Replays paraphrase the paper with fictional data. Experiment tools are simulated; no real systems are touched.</span>
          <a href={PAPER_URL} target="_blank" rel="noreferrer">
            Read the paper ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
