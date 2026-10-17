"""Run trials and append them to results/trials.jsonl (or results/pilot/trials.jsonl with --pilot).

Resumable: a (model, condition, trial) key already present with status "ok" or "error" is skipped.

Examples:
  python run_experiment.py --models llama3.2-3b --trials 1 --smoke
  python run_experiment.py --models llama3.2-3b qwen2.5-3b --trials 5 --pilot
  python run_experiment.py --models llama3.2-3b qwen2.5-3b gpt-5-nano gpt-5-mini --trials 30
"""

import argparse
import datetime as dt
import json
import os
import sys

from agent import run_trial
from conditions import CONDITIONS
from models import MODELS, get_backend
from score import score_cs3, score_cs8

HERE = os.path.dirname(os.path.abspath(__file__))
MAX_ATTEMPTS = 3  # 1 try + 2 retries


def load_done(path):
    done = set()
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                if line.strip():
                    r = json.loads(line)
                    done.add((r["model"], r["condition"], r["trial"]))
    return done


def one_trial(backend, model_key, cid, idx):
    cond = CONDITIONS[cid]
    last_err = None
    for _ in range(MAX_ATTEMPTS):
        try:
            res = run_trial(backend, cond)
            break
        except Exception as e:  # API failure, malformed output, etc.
            last_err = f"{type(e).__name__}: {e}"
    else:
        return {"experiment": cond["experiment"], "condition": cid, "model": model_key,
                "trial": idx, "status": "error", "error": last_err[:500],
                "settings": backend.settings,
                "timestamp": dt.datetime.now(dt.timezone.utc).isoformat()}

    outgoing = res["outgoing_text"]
    if cond["experiment"] == "cs8":
        success, details = score_cs8(res)
    else:
        success, details, outgoing = score_cs3(res, cond["redact"])
        if cond["redact"]:
            details["outgoing_text_raw"] = res["outgoing_text"]
    details["tool_calls"] = res["tool_calls"]
    details["final_state"] = res["final_state"]
    return {"experiment": cond["experiment"], "condition": cid, "model": model_key,
            "trial": idx, "status": "ok", "success": success, "details": details,
            "messages": res["messages"], "outgoing_text": outgoing,
            "hit_turn_limit": res["hit_turn_limit"], "settings": backend.settings,
            "usage": res["usage"],
            "timestamp": dt.datetime.now(dt.timezone.utc).isoformat()}


def print_transcript(r):
    print("=" * 80)
    print(f"{r['model']} {r['condition']} trial {r['trial']} status={r['status']} "
          f"success={r.get('success')}")
    if r["status"] != "ok":
        print("ERROR:", r["error"])
        return
    for m in r["messages"][1:]:
        line = f"[{m['role']}] {m.get('content', '')}"
        if m.get("tool_calls"):
            line += f"  TOOL_CALLS={[(t['name'], t['arguments']) for t in m['tool_calls']]}"
        print(line[:1500])
    d = {k: v for k, v in r["details"].items() if k not in ("tool_calls", "final_state", "outgoing_text_raw")}
    print("DETAILS:", d, "| turn_limit:", r["hit_turn_limit"], "| usage:", r["usage"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--models", nargs="+", default=list(MODELS))
    ap.add_argument("--conditions", nargs="+", default=list(CONDITIONS))
    ap.add_argument("--trials", type=int, default=30)
    ap.add_argument("--pilot", action="store_true", help="write to results/pilot/")
    ap.add_argument("--smoke", action="store_true", help="write to results/smoke/ and print transcripts")
    args = ap.parse_args()

    sub = "smoke" if args.smoke else ("pilot" if args.pilot else "")
    out_dir = os.path.join(HERE, "results", sub)
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "trials.jsonl")
    done = load_done(path)

    for model_key in args.models:  # one model at a time, sequentially
        backend = get_backend(model_key)
        for cid in args.conditions:
            for idx in range(args.trials):
                if (model_key, cid, idx) in done:
                    continue
                r = one_trial(backend, model_key, cid, idx)
                with open(path, "a") as f:
                    f.write(json.dumps(r) + "\n")
                if args.smoke:
                    print_transcript(r)
                else:
                    print(f"{model_key} {cid} #{idx}: {r['status']} success={r.get('success')} "
                          f"tools={[t['name'] for t in r.get('details', {}).get('tool_calls', [])]}",
                          flush=True)
    print("wrote", path, file=sys.stderr)


if __name__ == "__main__":
    main()
