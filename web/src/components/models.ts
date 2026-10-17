export const MODEL_COLORS = ["#ff9900", "#c45500", "#007185", "#232f3e"];

const LABELS: Record<string, string> = {
  "gpt-5-mini": "GPT-5 mini",
  "gpt-5-nano": "GPT-5 nano",
  "qwen2.5-3b": "Qwen 2.5 3B",
  "llama3.2-3b": "Llama 3.2 3B",
};

/** GPT models first, then the small open models. */
export const MODEL_ORDER = ["gpt-5-mini", "gpt-5-nano", "qwen2.5-3b", "llama3.2-3b"];

export function modelLabel(key: string): string {
  return LABELS[key] ?? key;
}

export function sortModels(keys: string[]): string[] {
  const rank = (k: string) => (MODEL_ORDER.indexOf(k) === -1 ? 99 : MODEL_ORDER.indexOf(k));
  return [...keys].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}
