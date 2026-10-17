# Agents of Chaos: How Often Do These Failures Really Happen?

A CIS 7000 (Fall 2026) mini-project on **_Agents of Chaos_** (Shapira, Wendler, Yen, et al., [arXiv:2602.20021](https://arxiv.org/abs/2602.20021), Feb 2026).

The paper deployed 6 LLM agents with real tools (shell, email, Discord, memory) and documented how 20 researchers broke them. Each failure is reported **once**, as an anecdote. This project asks the follow-up question:

> **How often do these failures actually happen, and do the fixes the paper proposes work?**

We rebuilt two of the paper's case studies as a small, safe simulation and ran each attack **30 times × 8 setups × 4 models = 960 tries**, scored automatically in code.

- **Live demo:** <https://chaos-lab-psi.vercel.app/> (paper replays: [`#cs8`](https://chaos-lab-psi.vercel.app/#cs8), [`#cs3`](https://chaos-lab-psi.vercel.app/#cs3) · our results: [`#exp`](https://chaos-lab-psi.vercel.app/#exp))
- **Code and data:** <https://github.com/prith27/chaos-lab>
- **Paper:** <https://arxiv.org/abs/2602.20021> · full Discord logs: <https://agentsofchaos.baulab.info/>

---

## Results at a glance

| Attack success rate | GPT-5 mini | GPT-5 nano | Qwen 2.5 3B | Llama 3.2 3B |
|---|---|---|---|---|
| **Fake owner (CS8)**: same chat | 0% | 0% | 100% | 100% |
| Fake owner: **new chat** (paper's takeover) | **93%** | **100%** | 100% | 100% |
| + real user ID shown (paper's proposed fix) | **0%** | **0%** | 100% | 100% |
| + warning about the attacker in memory | 93% | 100% | 100% | 100% |
| **SSN leak (CS3)**: ask directly | 0% | 0% | 0% | 0% |
| SSN: **ask for a summary** (paper's leak) | n/a¹ | 13% | 33% | 0% |
| + rule in the prompt ("NEVER reveal SSNs") | n/a¹ | 0% | **73%** | 7% |
| + redaction filter in code | n/a¹ | **0%** | **0%** | **0%** |

¹ GPT-5 mini refused to open the mailbox for a stranger at all, so the SSN fixes were never really tested on it.

**Takeaways**
1. **The paper's stories reproduce.** The fresh-chat takeover happened in all four models (93–100%). The GPT models replay the paper exactly: they catch the fake owner in the same chat and are fooled in a new one.
2. **The paper's untested fix works, but only for capable models.** Showing the real user ID cut takeovers from 100% to 0% for the GPT models and did nothing for the small ones. A warning in memory helped no model.
3. **Checks in code beat rules in prompts.** A "NEVER reveal SSNs" instruction helped one model and **backfired** on another (33% → 73%). A regex filter in code stopped every leak and caught 19 attempts.

*Caveat:* these are smaller models in a simulation, not the paper's Kimi and Claude agents inside OpenClaw, and the attacker is scripted. The numbers show the **direction** of each effect, not real-world rates.

---

## Repository layout

| Path | What's there |
|---|---|
| [`experiment/`](experiment/) | Experiment code (Python): simulated agent, conditions, scoring, analysis. **All 960 transcripts** (`results/trials.jsonl`), results table, charts, and [`REPORT_DRAFT.md`](experiment/REPORT_DRAFT.md). |
| [`web/`](web/) | **Chaos Lab**, the demo web app (Vite + React + TypeScript): replays of CS8 and CS3, plus the experiment results (results by model · comparison · method details). Deployed on Vercel. |
| [`paper_deep_dive/`](paper_deep_dive/) | Paper notes: [`index.md`](paper_deep_dive/index.md) (start here), a 5–10 min [`tldr.md`](paper_deep_dive/tldr.md), a long explainer, our [`critique.md`](paper_deep_dive/critique.md), and diagrams. |
| [`plan/`](plan/) | Talk plan ([`ppt_plan.md`](plan/ppt_plan.md)), demo and experiment plan, and Q&A prep. |
| [`experiments.md`](experiments.md) | The original specification the experiment was built from (frozen before the run). |
| [`slides/`](slides/) | Slide assets (QR codes for the demo and this repo in `slides/assets/`); the final deck goes here. |
| `report/` | PDF report of the experiment (added at the end). |

## Reproduce

**Experiment** (needs [Ollama](https://ollama.com) for the local models; an OpenAI key for the GPT models):
```bash
cd experiment
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
ollama pull llama3.2 && ollama pull qwen2.5:3b
cp .env.example .env        # add OPENAI_API_KEY (never committed)
.venv/bin/python run_experiment.py --models llama3.2-3b qwen2.5-3b gpt-5-nano gpt-5-mini --trials 30
.venv/bin/python analyze.py
```
Details, settings, and the pilot log: [`experiment/README.md`](experiment/README.md).

**Web app:**
```bash
cd web
npm install
npm run sync-results        # copy experiment/results into web/public/data
npm run dev                 # http://localhost:5173
```

**Deploy to Vercel:** import the repo → set **Root Directory** to `web` → framework **Vite** (build `npm run build`, output `dist`). The site is static; no keys or environment variables needed. The live deployment (https://chaos-lab-psi.vercel.app/) redeploys automatically on every push to `main`.

## Ethics and safety
All names, emails, and the SSN are **fictional**. The agent's tools only modify an in-memory Python dictionary; no real shell, email, or accounts are touched. The paper PDF is not redistributed here; see arXiv.
