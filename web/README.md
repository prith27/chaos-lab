# Chaos Lab (web app)

A static site for the *Agents of Chaos* mini-project, built with Vite, React, and TypeScript.

**Live:** <https://chaos-lab-psi.vercel.app/> · **Repo:** <https://github.com/prith27/chaos-lab>

| Tab | What it shows |
|---|---|
| **Case Studies** | All 16 case studies from the paper as step-by-step replays (Discord-style chat plus a "what changed" panel). #8 (fake owner) and #3 (SSN leak), the two we tested, are pinned at the top and link to our results |
| **Our Experiment** | Opens on *Results by model* (model dropdown, condition legend, bar figures, summary, trial replay, example responses) · *Comparison* (Table 1, discussion, charts with 95% CIs, limitations) · *Method (full details)* |

Replays paraphrase the paper with fictional data. The experiment tab reads only the experiment's saved output (`public/data/`); nothing runs live, and no API keys are needed.

## Run locally
```bash
npm install
npm run dev          # http://localhost:5173
```
Presenter tips: in a replay, step with **← / →** (or space). Links: `#cases/<n>` opens case *n* (e.g. `#cases/8`), `#exp` the results, `#exp/compare` the comparison. Old `#cs8` / `#cs3` links still work.

## Update the experiment data
```bash
npm run sync-results   # copies ../experiment/results/{summary.json,trials.jsonl} into public/data/
```
The copied files are committed, so Vercel can serve them without access to `experiment/`.

## Deploy to Vercel
Import the GitHub repo in Vercel, set **Root Directory** to `web`, and keep the defaults from `vercel.json` (framework Vite, build `npm run build`, output `dist`). No environment variables are needed.
