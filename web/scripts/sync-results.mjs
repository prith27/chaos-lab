// Copies the experiment's results into the web app's static data folder.
//   experiment/results/summary.json  -> web/public/data/summary.json
//   experiment/results/trials.jsonl  -> web/public/data/trials.json (JSON array)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "..", "experiment", "results");
const dst = join(here, "..", "public", "data");
mkdirSync(dst, { recursive: true });

const summaryPath = join(src, "summary.json");
const trialsPath = join(src, "trials.jsonl");
if (!existsSync(summaryPath) || !existsSync(trialsPath)) {
  console.error(`Missing results. Expected:\n  ${summaryPath}\n  ${trialsPath}\nRun the experiment + analyze.py first.`);
  process.exit(1);
}

const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
writeFileSync(join(dst, "summary.json"), JSON.stringify(summary));

const trials = readFileSync(trialsPath, "utf8")
  .split("\n")
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l));
writeFileSync(join(dst, "trials.json"), JSON.stringify(trials));

console.log(`Synced ${summary.cells.length} cells and ${trials.length} trials into web/public/data/`);
