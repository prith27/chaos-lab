# Index: How to Read These Notes

Mini-project for **CIS 7000 (Fall 2026)** on *Agents of Chaos* (Shapira, Wendler, Yen, et al., arXiv:2602.20021).
**Deliverable:** 8-minute talk (4 min paper overview + 4 min on our own small-scale result), followed by ~8 min of in-depth Q&A.

---

## What's in this project

| File | What it is | Read when |
|---|---|---|
| [`tldr.md`](tldr.md) | **Short version (5–10 min).** Covers the whole paper briefly: timeline, setup, all 16 cases, discussion, limitations. | **Start here.** Re-read right before presenting. |
| [`agents_of_chaos_explained.md`](agents_of_chaos_explained.md) | **Long version (~30 min).** Every case study in detail, with diagrams, vocabulary, likely Q&A answers, and a cheat sheet. | When you need detail on a specific case, or to prepare for Q&A. |
| [`critique.md`](critique.md) | **Our own critique**: 12 issues with the paper's methods and claims, its strengths, and how each issue maps to our mini-project. | Before the talk; essential for Q&A. |
| [`diagrams/`](diagrams/) | Rendered PNG diagrams (**OpenClaw architecture, Moltbook**, setup, CS1, CS3, CS7, CS8, CS10, missing pieces, responsibility). | When building slides; drag them straight into the deck. |
| [arXiv 2602.20021](https://arxiv.org/abs/2602.20021) | The original paper (84 pages). Kept locally in `paper/` but not committed to the repo. | To check a fact or quote exactly. |
| [`../plan/ppt_plan.md`](../plan/ppt_plan.md) | Slide-by-slide plan for the 8-min talk (paper → critique → our experiment), **with the real results filled in**. | When building the deck. |
| [`../plan/ui_demo_plan.md`](../plan/ui_demo_plan.md) | Experiment design, **hypotheses vs. what happened**, and the web app as built. | When explaining the experiment. |
| [`../experiment/`](../experiment/) | The experiment code, all 960 saved transcripts, results table, charts, and `REPORT_DRAFT.md`. | To check a number or reproduce the run. |
| [`../web/`](../web/) | The *Chaos Lab* demo app (Vite + React), deployed on Vercel. | Before demoing. |
| [`../experiments.md`](../experiments.md) | The original brief the experiment was built from: exact prompts, conditions, scoring, models, output formats. | To see exactly what was specified before the run. |
| [`../plan/qa_prep.md`](../plan/qa_prep.md) | Prepared answers for the ~8 min Q&A (notes for you, not slides). | Night before + during Q&A. |

## Reading paths

| You have… | Read |
|---|---|
| **5 minutes** | `tldr.md` sections 1, 5, 7½ (our results), and 8 |
| **10 minutes** | All of `tldr.md` |
| **30 minutes** | `tldr.md`, then `agents_of_chaos_explained.md` sections 4–7 |
| **Prepping for Q&A** | `critique.md`, `../plan/qa_prep.md`, then `agents_of_chaos_explained.md` sections 8–10 |
| **Checking a fact** | The PDF page map below |

## PDF page map (where things are in the paper)

| Topic | Section | Page |
|---|---|---|
| Intro, definition of "agent," autonomy levels | §1 | 4 |
| Setup (OpenClaw, VMs, models, Discord, email) | §2 | 5 |
| Evaluation procedure and methodology | §3 | 8 |
| CS1 Disproportionate response | §4 | 10 |
| CS2 Non-owner compliance | §5 | 13 |
| CS3 Sensitive info disclosure | §6 | 15 |
| CS4 Looping / CS5 DoS | §7–8 | 18–20 |
| CS6 Provider values | §9 | 20 |
| CS7 Agent harm | §10 | 23 |
| CS8 Identity spoofing | §11 | 25 |
| CS9 Collaboration / CS10 Corruption / CS11 Libel | §12–14 | 28–33 |
| CS12–16 Failed attacks ("hypothetical cases") | §15 | 34–39 |
| Discussion (social coherence, missing pieces, multi-agent, responsibility) | §16 | 40–43 |
| Related work | §17 | 44 |
| Conclusion | §18 | 48 |
| Appendices (OpenClaw config, full Discord and email logs) | A | 59+ |

Full Discord logs: <https://agentsofchaos.baulab.info/>

## Symbols used in these notes

| Symbol | Meaning |
|---|---|
| ❌ | Attack succeeded / agent failed |
| ✅ | Agent held up / attack failed |
| ⚠️ | Held up, but for the wrong reasons (e.g., CS15) |
| ⭐ | Best case to present |
| CS*n* | Case Study *n* in the paper |
| Owner / non-owner | Agent's admin vs. anyone else |
