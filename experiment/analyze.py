"""Aggregate trials.jsonl into summary.json, results_table.md, and charts.

  python analyze.py                       # results/
  python analyze.py --results-dir results/pilot
"""

import argparse
import datetime as dt
import json
import math
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

from conditions import CONDITIONS, LABELS  # noqa: E402
from models import MODELS, OPENAI_PRICES  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
MODEL_ORDER = list(MODELS)
# Fixed categorical order (validated: CVD and normal-vision separation pass on white).
COLORS = {"llama3.2-3b": "#2a78d6", "qwen2.5-3b": "#eb6834",
          "gpt-5-nano": "#1baf7a", "gpt-5-mini": "#eda100"}


def wilson(k, n, z=1.96):
    if n == 0:
        return None, None
    p = k / n
    denom = 1 + z * z / n
    center = (p + z * z / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return round(max(0.0, center - half), 4), round(min(1.0, center + half), 4)


def load(path):
    with open(path) as f:
        return [json.loads(line) for line in f if line.strip()]


def summarize(rows):
    cells, cost = [], {}
    for cid, cond in CONDITIONS.items():
        for m in MODEL_ORDER:
            rs = [r for r in rows if r["model"] == m and r["condition"] == cid]
            if not rs:
                continue
            ok = [r for r in rs if r["status"] == "ok"]
            n, k = len(ok), sum(r["success"] for r in ok)
            lo, hi = wilson(k, n)
            tool_key = "any_tool_called" if cond["experiment"] == "cs8" else "called_read_emails"
            tools = sum(bool(r["details"][tool_key]) for r in ok)
            cell = {"experiment": cond["experiment"], "condition": cid, "label": LABELS[cid],
                    "model": m, "n": n, "errors": len(rs) - n, "successes": k,
                    "rate": round(k / n, 4) if n else None, "ci_low": lo, "ci_high": hi,
                    "tool_use_rate": round(tools / n, 4) if n else None,
                    "turn_limit_hits": sum(r["hit_turn_limit"] for r in ok),
                    "text_tool_call_suspected": sum(r["details"]["text_tool_call_suspected"] for r in ok)}
            if cond["experiment"] == "cs3":
                cell["leak_account_rate"] = round(sum(r["details"]["leak_account"] for r in ok) / n, 4) if n else None
                cell["leak_medical_rate"] = round(sum(r["details"]["leak_medical"] for r in ok) / n, 4) if n else None
                cell["leak_raw_rate"] = round(sum(r["details"]["leak_raw"] for r in ok) / n, 4) if n else None
            cells.append(cell)
    for m in MODEL_ORDER:
        ok = [r for r in rows if r["model"] == m and r["status"] == "ok"]
        if not ok:
            continue
        tin = sum(r["usage"]["input_tokens"] for r in ok)
        tout = sum(r["usage"]["output_tokens"] for r in ok)
        p_in, p_out = OPENAI_PRICES.get(m, (0.0, 0.0))
        cost[m] = {"input_tokens": tin, "output_tokens": tout,
                   "cost_usd": round(tin / 1e6 * p_in + tout / 1e6 * p_out, 4),
                   "settings": ok[-1]["settings"]}
    return cells, cost


def pct(x):
    return "–" if x is None else f"{100 * x:.0f}%"


def write_table(cells, path):
    lines = []
    for exp, title, metric in [("cs8", "CS8: fake-owner takeover rate", "takeover"),
                               ("cs3", "CS3: SSN leak rate", "SSN leak")]:
        lines += [f"### {title}", "",
                  f"| Condition | Model | {metric} rate [95% CI] | n | errors | tool-use rate |"
                  + (" raw leak (pre-filter) | acct leak | medical leak |" if exp == "cs3" else ""),
                  "|---|---|---|---|---|---|" + ("---|---|---|" if exp == "cs3" else "")]
        for c in (c for c in cells if c["experiment"] == exp):
            row = (f"| {c['condition']} {c['label']} | {c['model']} | {pct(c['rate'])} "
                   f"[{pct(c['ci_low'])}, {pct(c['ci_high'])}] | {c['n']} | {c['errors']} | "
                   f"{pct(c['tool_use_rate'])} |")
            if exp == "cs3":
                row += (f" {pct(c['leak_raw_rate'])} | {pct(c['leak_account_rate'])} | "
                        f"{pct(c['leak_medical_rate'])} |")
            lines.append(row)
        lines.append("")
    lines.append("Tool-use rate: CS8 = share of trials with any tool call; CS3 = share that called "
                 "`read_emails`. A 0% leak with low tool use means the model never read the mailbox.")
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")


def grouped_bars(cells, exp, key, title, ylabel, path, with_ci=True):
    conds = [cid for cid, c in CONDITIONS.items() if c["experiment"] == exp]
    models = [m for m in MODEL_ORDER if any(c["model"] == m for c in cells)]
    width = 0.8 / max(len(models), 1)
    plt.rcParams.update({"font.size": 16})
    fig, ax = plt.subplots(figsize=(13, 6.5), facecolor="white")
    ax.set_facecolor("white")
    for i, m in enumerate(models):
        xs, ys, lo, hi = [], [], [], []
        for j, cid in enumerate(conds):
            c = next((c for c in cells if c["model"] == m and c["condition"] == cid), None)
            if c is None or c[key] is None:
                continue
            x = j - 0.4 + width * (i + 0.5)
            y = 100 * c[key]
            xs.append(x); ys.append(y)
            lo.append(y - 100 * c["ci_low"]); hi.append(100 * c["ci_high"] - y)
            ax.text(x, 100 * c["ci_high"] + 1.5, f"{y:.0f}", ha="center", va="bottom", fontsize=11, color="#333333")
        ax.bar(xs, ys, width * 0.92, label=m, color=COLORS.get(m), zorder=2)
        if with_ci:
            ax.errorbar(xs, ys, yerr=[lo, hi], fmt="none", ecolor="#555555",
                        elinewidth=1.2, capsize=3, zorder=3)
    ax.set_xticks(range(len(conds)))
    ax.set_xticklabels([f"{cid}\n{LABELS[cid]}" for cid in conds], fontsize=14)
    ax.set_ylim(0, 112)
    ax.set_yticks(range(0, 101, 20))
    ax.set_ylabel(ylabel)
    ax.set_title(title, fontsize=20, pad=14)
    ax.grid(axis="y", color="#e5e5e5", zorder=0)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.legend(ncol=len(models), loc="upper center", bbox_to_anchor=(0.5, -0.17), frameon=False)
    fig.tight_layout()
    fig.savefig(path, dpi=200, facecolor="white")
    plt.close(fig)


def tool_use_chart(cells, path):
    conds = list(CONDITIONS)
    models = [m for m in MODEL_ORDER if any(c["model"] == m for c in cells)]
    width = 0.8 / max(len(models), 1)
    plt.rcParams.update({"font.size": 16})
    fig, ax = plt.subplots(figsize=(15, 6.5), facecolor="white")
    for i, m in enumerate(models):
        xs, ys = [], []
        for j, cid in enumerate(conds):
            c = next((c for c in cells if c["model"] == m and c["condition"] == cid), None)
            if c and c["tool_use_rate"] is not None:
                xs.append(j - 0.4 + width * (i + 0.5)); ys.append(100 * c["tool_use_rate"])
        ax.bar(xs, ys, width * 0.92, label=m, color=COLORS.get(m), zorder=2)
    ax.set_xticks(range(len(conds)))
    ax.set_xticklabels(conds, fontsize=15)
    ax.axvline(3.5, color="#999999", linestyle="--", linewidth=1)
    ax.text(1.5, 104, "CS8: any tool called", ha="center", fontsize=14)
    ax.text(5.5, 104, "CS3: called read_emails", ha="center", fontsize=14)
    ax.set_ylim(0, 112)
    ax.set_yticks(range(0, 101, 20))
    ax.set_ylabel("Trials (%)")
    ax.set_title("Tool-use rate by model and condition", fontsize=20, pad=14)
    ax.grid(axis="y", color="#e5e5e5", zorder=0)
    for s in ("top", "right"):
        ax.spines[s].set_visible(False)
    ax.legend(ncol=len(models), loc="upper center", bbox_to_anchor=(0.5, -0.1), frameon=False)
    fig.tight_layout()
    fig.savefig(path, dpi=200, facecolor="white")
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--results-dir", default=os.path.join(HERE, "results"))
    args = ap.parse_args()
    rd = args.results_dir
    rows = load(os.path.join(rd, "trials.jsonl"))
    cells, cost = summarize(rows)
    per_cell = max((c["n"] + c["errors"] for c in cells), default=0)
    summary = {"generated": dt.datetime.now(dt.timezone.utc).isoformat(),
               "trials_per_cell": per_cell, "cells": cells, "conditions": LABELS,
               "usage_by_model": cost,
               "openai_cost_usd": round(sum(v["cost_usd"] for v in cost.values()), 4)}
    with open(os.path.join(rd, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    write_table(cells, os.path.join(rd, "results_table.md"))
    os.makedirs(os.path.join(rd, "charts"), exist_ok=True)
    grouped_bars(cells, "cs8", "rate", "CS8: Fake-owner takeover rate", "Takeover rate (%)",
                 os.path.join(rd, "charts", "cs8.png"))
    grouped_bars(cells, "cs3", "rate", "CS3: SSN leak rate", "SSN leak rate (%)",
                 os.path.join(rd, "charts", "cs3.png"))
    tool_use_chart(cells, os.path.join(rd, "charts", "tool_use.png"))
    print(f"{len(rows)} trials -> {rd}/summary.json, results_table.md, charts/")


if __name__ == "__main__":
    main()
