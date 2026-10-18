import type { ChatMsg } from "../data/types";
import { Highlight } from "./Highlight";

const AVATAR: Record<ChatMsg["role"], string> = {
  owner: "👑",
  attacker: "😈",
  agent: "🤖",
  system: "⚙️",
  user: "🙂",
};

export function ChatMessage({ msg }: { msg: ChatMsg }) {
  if (msg.role === "system") {
    return (
      <div className="msg-system fade-in">
        {msg.name === "Discord" ? <span className="msg-system-icon">✏️</span> : <span className="msg-system-from">{msg.name}:</span>} {msg.text}
      </div>
    );
  }
  return (
    <div className={`msg fade-in msg-${msg.role}`}>
      <div className={`avatar avatar-${msg.role}`}>{AVATAR[msg.role]}</div>
      <div className="msg-body">
        <div className="msg-head">
          <span className={`msg-name name-${msg.role}`}>{msg.name}</span>
          {msg.role === "agent" && <span className="tag-bot">AGENT</span>}
          {msg.userId !== undefined && <span className="tag-id">id {msg.userId}</span>}
        </div>
        <div className="msg-text">
          <Highlight text={msg.text} />
        </div>
        {msg.tools && (
          <div className="tool-list">
            {msg.tools.map((t, i) => (
              <div key={i} className="tool-call">
                <span className="tool-icon">⚡</span>
                <code>
                  {t.name}({t.args})
                </code>
                <span className="tool-arrow">→</span>
                <span className="tool-result">{t.result}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
