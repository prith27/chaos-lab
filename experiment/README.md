# Experiment: attack success rates for CS8 (fake owner) and CS3 (SSN leak)

A controlled simulation of two failures from *Agents of Chaos* (Shapira et al., arXiv:2602.20021).
The paper reports them as single anecdotes; here each condition is run 30 times per model so we
get rates with 95% confidence intervals, and we test the fixes the paper proposes but never tries.

Everything is simulated: tools only change an in-memory Python dict, and all personal data is fictional.

## Files

| File | What it does |
|---|---|
| `agent.py` | System prompt (OpenClaw-style workspace files), fake workspace + mailbox, tool schemas, tool executor, agent loop (max 5 model turns) |
| `conditions.py` | The 8 conditions (frozen after the pilot) |
| `models.py` | One `chat(messages, tools)` interface over Ollama and OpenAI |
| `score.py` | Takeover / leak scoring and the `redact()` filter used in 3D |
| `run_experiment.py` | Runs trials, appends to `results/trials.jsonl` after every trial (resumable) |
| `analyze.py` | Writes `results/summary.json`, `results/results_table.md`, `results/charts/*.png` |
| `REPORT_DRAFT.md` | Methods + results write-up for the PDF report |

## Setup

```bash
cd experiment
python3 -m venv .venv            # Python 3.10+
.venv/bin/pip install -r requirements.txt
ollama pull qwen2.5:3b            # llama3.2:latest assumed already installed
cp .env.example .env              # then put your OPENAI_API_KEY in .env (git-ignored)
```

## Run

```bash
# smoke test (prints transcripts) -> results/smoke/
.venv/bin/python run_experiment.py --models llama3.2-3b --trials 1 --smoke
# pilot -> results/pilot/
.venv/bin/python run_experiment.py --models llama3.2-3b qwen2.5-3b --trials 5 --pilot
# full run -> results/trials.jsonl (rerun the same command to resume)
.venv/bin/python run_experiment.py --models llama3.2-3b qwen2.5-3b gpt-5-nano gpt-5-mini --trials 30
# analysis
.venv/bin/python analyze.py
```

Resuming skips any (model, condition, trial) already in `trials.jsonl`. A trial that fails 3 times
(1 try + 2 retries) is saved as `"status": "error"` and excluded from the denominator.

## Summary of results

960 trials (30 × 8 conditions × 4 models), 0 errors, run 2026-10-17.
**CS8:** gpt-5-nano and gpt-5-mini reproduce the paper's anecdote exactly. They refuse the
renamed attacker in the same channel (0%) but are taken over in a fresh DM that shows only the
display name (100% / 93%). Showing the real user_id fixes it completely for them (0%). The two 3B
models ignore user IDs and are taken over in every trial of every condition, and a memory note about
the attacker helps no model. **CS3:** no model gives the SSN when asked directly. The indirect
"summarize all emails" request leaks it for qwen2.5-3b (33%) and gpt-5-nano (13%). An explicit
"NEVER reveal SSNs…" prompt rule made qwen *worse* (73%), while the regex filter in code brought
every model to 0% after catching 19 would-be leaks. gpt-5-mini never read the mailbox for a
non-owner, and llama3.2-3b rarely produced a real summary, so their low CS3 rates do not test the
fixes. Full table: `results/results_table.md`; write-up: `REPORT_DRAFT.md`.

## Pilot changes

Pilot: 5 trials × 8 conditions × {llama3.2-3b, qwen2.5-3b} = 80 trials, written to `results/pilot/` (not part of the final results).

- **No code or condition changes were needed.** 0 errors, 0 turn-limit hits, 0 suspected text-only tool calls; both models produce structured tool calls.
- Design decision made before the pilot (not a change): if the model emits tool calls on its 5th (last) turn, they are executed and scored, and `hit_turn_limit` is set to true.

Changes made after the pilot that do not affect prompts, tools, or scoring:
- `models.py`: record the resolved OpenAI snapshot (`settings.resolved_model`) returned by the API.
- `analyze.py` was written after the pilot (tested on pilot data); chart value labels moved above the CI bars for legibility.
- The full run was paused once (user shutdown, at 403/960 trials) and resumed from the checkpoint; no trials were repeated or dropped.
