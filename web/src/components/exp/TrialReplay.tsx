import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMsg, Trial } from "../../data/types";
import { EXPERIMENTS, SETUPS, modelInfo, outcomeKind } from "../../data/story";
import { ChatMessage } from "../ChatMessage";

interface Props {
  trial: Trial;
  onClose: () => void;
  onReadFull: () => void;
}

type ToolRec = { name: string; arguments?: Record<string, unknown>; result?: string };

function parseIncoming(raw: string): ChatMsg[] {
  // Messages arrive as "[channel] Name (user_id=N): text"; history can contain several lines.
  const out: ChatMsg[] = [];
  const re = /^\[([^\]]+)\]\s*([^:(]+?)(?:\s*\(user_id=(\d+)\))?:\s*([\s\S]*)$/;
  const m = raw.match(re);
  if (!m) return [{ role: "attacker", name: "Attacker", text: raw }];
  const [, , name, id, text] = m;
  if (name.trim().toLowerCase() === "system") return [{ role: "system", name: "Discord", text }];
  out.push({ role: "attacker", name: name.trim(), userId: id ? Number(id) : undefined, text });
  return out;
}

/** Turns a recorded trial into chat messages for the replay. */
function toChat(t: Trial, agentName: string): ChatMsg[] {
  const recs = ((t.details as { tool_calls?: ToolRec[] }).tool_calls ?? []).slice();
  const msgs: ChatMsg[] = [];
  for (const m of t.messages) {
    if (m.role === "system" || m.role === "tool") continue;
    const text = typeof m.content === "string" ? m.content : "";
    if (m.role === "user") msgs.push(...parseIncoming(text));
    else if (m.role === "assistant") {
      const calls = Array.isArray(m.tool_calls) ? (m.tool_calls as ToolRec[]) : [];
      const tools = calls.map((c) => {
        const rec = recs.shift();
        const args = Object.values(c.arguments ?? {}).map((v) => JSON.stringify(v)).join(", ");
        const res = rec?.result ?? "";
        return { name: c.name, args, result: c.name === "read_emails" ? "6 emails" : res.slice(0, 40) };
      });
      if (text.trim() || tools.length) msgs.push({ role: "agent", name: agentName, text: text.trim(), tools: tools.length ? tools : undefined });
    }
  }
  if (t.condition === "3D" && t.outgoing_text && (t.details as { leak_raw?: number }).leak_raw) {
    msgs.push({ role: "system", name: "Filter", text: "Code filter applied. This is what was actually sent:" });
    msgs.push({ role: "agent", name: `${agentName} (after filter)`, text: t.outgoing_text });
  }
  return msgs;
}

export function TrialReplay({ trial, onClose, onReadFull }: Props) {
  const model = modelInfo(trial.model);
  const setup = SETUPS[trial.experiment].find((s) => s.id === trial.condition);
  const meta = EXPERIMENTS[trial.experiment];
  const msgs = useMemo(() => toChat(trial, model?.name ?? trial.model), [trial, model]);
  const [shown, setShown] = useState(0);
  const end = useRef<HTMLDivElement>(null);
  const done = shown >= msgs.length;
  const kind = outcomeKind(trial);

  useEffect(() => {
    setShown(0);
  }, [trial]);
  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 300 : 1100);
    return () => clearTimeout(id);
  }, [shown, done]);
  useEffect(() => {
    const el = end.current?.parentElement;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [shown]);

  const verdict =
    kind === "bad" ? meta.bad : kind === "good" ? meta.good : kind === "partial" ? "SSN safe, but other data leaked" : "Never opened the mailbox";

  return (
    <div className="card replay1">
      <div className="replay1-head">
        <div>
          <span className="pill">Trial replay</span>
          <h3>
            {model?.name}, {trial.condition} {setup?.name}
          </h3>
          <p className="muted small">
            Trial {trial.trial + 1} of 30. Chosen by a fixed rule: the first recorded trial with this condition's most common outcome.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onClose}>
          ✕ Close
        </button>
      </div>
      <div className="replay1-chat">
        {msgs.slice(0, shown).map((m, i) => (
          <ChatMessage key={i} msg={m} />
        ))}
        {!done && <div className="typing"><span /><span /><span /></div>}
        <div ref={end} />
      </div>
      <div className="replay1-foot">
        {done ? (
          <div className={`replay1-verdict v-${kind}`}>{verdict}</div>
        ) : (
          <button className="btn btn-secondary" onClick={() => setShown(msgs.length)}>
            Skip to end
          </button>
        )}
        <button className="link-btn" onClick={onReadFull}>
          All 30 transcripts
        </button>
      </div>
    </div>
  );
}
