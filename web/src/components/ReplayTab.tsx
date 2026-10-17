import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ChatMsg, Scenario } from "../data/types";
import { ChatMessage } from "./ChatMessage";
import { PAPER_URL } from "../constants";

interface Props<S> {
  scenario: Scenario<S>;
  renderState: (state: S) => ReactNode;
  active: boolean;
}


export function ReplayTab<S>({ scenario, renderState, active }: Props<S>) {
  const [step, setStep] = useState(0);
  const last = scenario.steps.length - 1;
  const cur = scenario.steps[step];
  const chatScroll = useRef<HTMLDivElement>(null);

  // Arrow keys / space step through the replay (presenter-friendly).
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setStep((s) => Math.min(last, s + 1));
      } else if (e.key === "ArrowLeft") {
        setStep((s) => Math.max(0, s - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, last]);

  const { channels, messages } = useMemo(() => {
    const seen: string[] = [];
    const byChannel: Record<string, ChatMsg[]> = {};
    scenario.steps.slice(0, step + 1).forEach((s) => {
      if (!seen.includes(s.channel)) seen.push(s.channel);
      byChannel[s.channel] = [...(byChannel[s.channel] ?? []), ...s.add];
    });
    return { channels: seen, messages: byChannel[cur.channel] ?? [] };
  }, [scenario, step, cur.channel]);

  // Scroll only the chat box to its newest message; never move the page itself.
  useEffect(() => {
    const el = chatScroll.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [step, cur.channel]);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <span className="pill">{scenario.caseLabel}</span>
          <h1>{scenario.title}</h1>
          <p className="muted">{scenario.subtitle}</p>
          <p className="replay-note">A replay of the paper's case with made-up data. Wording is paraphrased.</p>
        </div>
        <a className="source" href={PAPER_URL} target="_blank" rel="noreferrer" title="Open the paper on arXiv">
          <span className="source-text">
            <span className="source-label">In the paper</span>
            <span className="source-ref">{scenario.paperRef}</span>
          </span>
          <span className="source-arrow">↗</span>
        </a>
      </header>

      <div className="replay-grid">
        {/* Chat window */}
        <div className="card chat-card">
          <aside className="chat-sidebar">
            <div className="chat-server">Lab Server</div>
            <div className="chat-section">Channels</div>
            {channels.map((c) => (
              <div key={c} className={`chat-channel ${c === cur.channel ? "active" : ""}`}>
                {c.startsWith("#") ? c : `@ ${c.replace("DM · ", "")}`}
              </div>
            ))}
          </aside>
          <div className="chat-main">
            <div className="chat-topbar">
              <strong>{cur.channel}</strong>
              <span className="muted small">
                {cur.channel.startsWith("DM") ? "Private message · fresh context" : "Shared channel"}
              </span>
            </div>
            <div className="chat-scroll" ref={chatScroll}>
              {messages.length === 0 && (
                <div className="chat-empty">No messages yet in {cur.channel}. Press Next ▶</div>
              )}
              {messages.map((m, i) => (
                <ChatMessage key={`${cur.channel}-${i}`} msg={m} />
              ))}
            </div>
          </div>
        </div>

        {/* Right column: narration + state */}
        <div className="side-col">
          <div className={`card buybox tone-${cur.narration.tone}`}>
            <div className="buybox-kicker">Step {step + 1} of {last + 1}</div>
            <div className="buybox-text">
              <h2 className="buybox-title">{cur.narration.title}</h2>
              <p className="buybox-body">{cur.narration.body}</p>
            </div>
            <div className="stepper">
              {scenario.steps.map((_, i) => (
                <button
                  key={i}
                  className={`dot ${i === step ? "on" : ""} ${i < step ? "done" : ""}`}
                  onClick={() => setStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>
            <div className="controls">
              <button
                className="btn btn-secondary"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
              >
                ◀ Back
              </button>
              {step < last ? (
                <button className="btn btn-primary" onMouseDown={(e) => e.preventDefault()} onClick={() => setStep(step + 1)}>
                  Next ▶
                </button>
              ) : (
                <button className="btn btn-accent" onMouseDown={(e) => e.preventDefault()} onClick={() => setStep(0)}>
                  ↺ Replay
                </button>
              )}
            </div>
            <div className="hint">Arrow keys also work</div>
          </div>

          <div className="card state-card">
            <div className="state-head">
              <span>System state</span>
              <span className="muted small">{scenario.agentName}'s machine</span>
            </div>
            {renderState(cur.state)}
          </div>
        </div>
      </div>
    </section>
  );
}
