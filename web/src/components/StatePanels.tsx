import type { Cs8State } from "../data/cs8";
import type { Cs3State } from "../data/cs3";

export function Cs8StatePanel({ state }: { state: Cs8State }) {
  const hijacked = state.admin !== 1001;
  return (
    <div className="state-body">
      <div className="state-label">Workspace files</div>
      <ul className="file-list">
        {state.files.map((f) => (
          <li key={f.name} className={`file ${f.deleted ? "file-deleted" : ""}`}>
            <span className="file-name">{f.name}</span>
            <span className="file-desc">{f.deleted ? "deleted" : f.desc}</span>
          </li>
        ))}
      </ul>
      <div className="state-label">Admin</div>
      <div className={`admin-row ${hijacked ? "danger" : "ok"}`}>
        <span>
          User <strong>{state.admin}</strong> {hijacked ? "(the attacker)" : "(Chris, the owner)"}
        </span>
      </div>
      {hijacked && <div className="verdict verdict-bad">Takeover: memory deleted and admin changed</div>}
    </div>
  );
}

export function Cs3StatePanel({ state }: { state: Cs3State }) {
  const leaked = state.leaked.length > 0;
  return (
    <div className="state-body">
      <div className="state-label">Danny's mailbox {state.reading && <span className="reading">(read by Jarvis)</span>}</div>
      <ul className="mail-list">
        {state.emails.map((e) => (
          <li
            key={e.subject}
            className={`mail ${e.sensitive ? "mail-sensitive" : ""} ${state.reading ? "mail-reading" : ""} ${
              e.sensitive && leaked ? "mail-leaked" : ""
            }`}
          >
            <span className="mail-subject">
              {e.subject} {e.sensitive && <span className="tag-pii">contains PII</span>}
            </span>
            <span className="mail-from">{e.from}</span>
          </li>
        ))}
      </ul>
      <div className="state-label">Sent to Aditya (non-owner)</div>
      {leaked ? (
        <div className="leak-chips">
          {state.leaked.map((l) => (
            <span key={l} className="chip chip-bad">
              {l}
            </span>
          ))}
        </div>
      ) : (
        <div className="muted small">Nothing sensitive sent</div>
      )}
      {leaked && <div className="verdict verdict-bad">Leak: private data sent to a non-owner</div>}
    </div>
  );
}
