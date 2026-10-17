# Chaos Lab (web app)

A static site for the *Agents of Chaos* mini-project, built with Vite, React, and TypeScript.

| Tab | What it shows |
|---|---|
| **The Fake Owner** (CS8) | Step-by-step replay of the paper's identity-spoofing takeover, with an "actual system state" panel |
| **The SSN Leak** (CS3) | Replay of the indirect sensitive-data leak |
| **Our Experiment** | Opens on *Results by model* (model dropdown, condition legend, bar figures, summary, trial replay, example responses) · *Comparison* (Table 1, discussion, charts with 95% CIs, limitations) · *Method (full details)* (setup, Figure A1, Tables A1–A2) |

Replays paraphrase the paper with fictional data. The experiment tab reads only the experiment's saved output (`public/data/`); nothing runs live, and no API keys are needed.

## Run locally
```bash
npm install
npm run dev          # http://localhost:5173
```
Presenter tips: on the replay tabs, step with **← / →** (or space). Tabs are linkable via `#cs8`, `#cs3`, `#exp`.

## Update the experiment data
```bash
npm run sync-results   # copies ../experiment/results/{summary.json,trials.jsonl} into public/data/
```
The copied files are committed, so Vercel can serve them without access to `experiment/`.

## Deploy to Vercel
Import the GitHub repo in Vercel, set **Root Directory** to `web`, and keep the defaults from `vercel.json` (framework Vite, build `npm run build`, output `dist`). No environment variables are needed.
