export type Role = "owner" | "attacker" | "agent" | "system" | "user";

export interface ToolCall {
  name: string;
  args: string;
  result: string;
}

export interface ChatMsg {
  role: Role;
  name: string;
  userId?: number;
  text: string;
  tools?: ToolCall[];
}

export type Tone = "info" | "good" | "bad" | "warn";

export interface Step<S> {
  /** Channel shown while this step is active. */
  channel: string;
  /** Messages posted in this step (to `channel`). */
  add: ChatMsg[];
  narration: { title: string; body: string; tone: Tone };
  state: S;
}

export interface Scenario<S> {
  id: string;
  caseLabel: string;
  title: string;
  subtitle: string;
  paperRef: string;
  agentName: string;
  steps: Step<S>[];
}

// ---------- experiment results (written by experiment/analyze.py) ----------

export interface Cell {
  experiment: "cs8" | "cs3";
  condition: string;
  label: string;
  model: string;
  n: number;
  errors: number;
  successes: number;
  rate: number;
  ci_low: number | null;
  ci_high: number | null;
  tool_use_rate?: number;
}

export interface Summary {
  generated: string;
  trials_per_cell: number;
  sample?: boolean;
  cells: Cell[];
  conditions: Record<string, string>;
}

export interface TrialMessage {
  role: string;
  content?: string | null;
  name?: string;
  tool_calls?: unknown;
}

export interface Trial {
  experiment: "cs8" | "cs3";
  condition: string;
  model: string;
  trial: number;
  status: "ok" | "error";
  success: 0 | 1;
  details: Record<string, unknown>;
  messages: TrialMessage[];
  outgoing_text?: string;
}
