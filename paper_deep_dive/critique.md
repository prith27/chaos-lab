# Critique: What *Agents of Chaos* Gets Right, and What It Misses

My own assessment, going beyond the limitations the paper states. Each point cites where in the paper it comes from, so it holds up in Q&A.
**Short version for slides:** *The paper shows that serious failures exist. But because the attackers, the configuration, and the definition of "failure" were all uncontrolled, it can't tell us **how often** these failures happen, **what causes them** (the model or the framework), or **whether the proposed fixes would work**.*

---

## What the paper does well (say this first; it's fair and earns credibility)

- **Realism no benchmark has:** live email, Discord, shell, 24/7 agents, and real people with competing interests.
- **Multi-agent behavior in the wild:** cross-agent spread (CS10), echo chambers (CS15), and peer warnings (CS16) have almost no prior empirical documentation.
- **Honesty about null results:** it reports 5 attacks that failed (CS12–16).
- **A useful vocabulary:** "social coherence," stakeholder model, self-model, report ≠ reality.
- **Released logs:** the full Discord transcripts are public, so the claims can be checked.

---

## Critique

### 1. No denominators: we can't tell how common any failure is
- The paper explicitly aims to show that failures exist, not how often they happen (§3). That's a legitimate goal, but it means **CS8 could succeed 1 time in 100 or 99 times in 100**, and the paper can't distinguish the two.
- **Selection bias:** "not all unsuccessful attempts were documented" (§15). The reported cases are the interesting ones, so we have no base rate.
- **Why it matters:** policy and engineering decisions need rates. A 1% failure and a 90% failure call for very different responses.

### 2. Model vs. framework vs. configuration are confounded
- Many failures trace back to **OpenClaw design or this lab's setup**, not to "LLM agents" in general:
  - CS1: there was **no email-delete tool** (an incomplete setup).
  - CS8: identity was based on **Discord display names**, and the configuration had no immutable owner ID.
  - CS14: the agent and the email server **shared storage**.
  - CS4: cron and heartbeats were buggy, and the OpenClaw version was upgraded mid-study (Feb 10).
- The paper argues some failures are "fundamental" (§16.3) but runs **no ablations** to separate model behavior from scaffolding. The fundamental vs. contingent split is argued, not measured.

### 3. The model comparison is unbalanced, so findings don't generalize to "LLMs"
- 4 agents ran on **Kimi K2.5** and 2 on **Claude Opus 4.6**. Different people attacked different agents, with different prompts.
- The most dramatic failures (CS1, CS7, CS8, CS10, CS11) all involve **Ash (Kimi)**. We can't tell whether that's the model, Ash's specific configuration, or simply that Ash got the most attention.
- Discussion claims about "LLM-backed agents" in general (§16.2) rest on very few, uneven samples.

### 4. "Failure" is defined after the fact, with no specified policy
- The agents were never given a clear **policy** for what non-owners may do. They were *told* to email lab members and interact with them.
- So is running `ls -la` for a friendly lab member (CS2) a failure, or reasonable helpfulness? Without a written spec, **any behavior can be labeled a failure afterwards**.
- A stronger design would write down the intended policy first ("non-owners may chat but not trigger file or email actions") and then measure violations against it.

### 5. Autonomy is overstated; humans were in the loop throughout
- The paper itself says the majority of agent actions were initiated by human intervention (§2), and that heartbeats and cron were buggy and rarely used.
- Setup often needed humans or **coding agents (Claude Code, Cursor)** working on the VM.
- CS4's original "infinite loop" turned out to be **a human prompting every few messages**.
- That sits awkwardly with the framing that agents act with "L4 autonomy." Many failures are really **agents obeying humans badly**, not agents running off on their own.

### 6. The attackers weren't representative
- The attackers were **expert AI researchers, many of them co-authors**, who knew the system's internals (the Discord ID scheme, the memory files) and could iterate many times. CS8 "was tried by several researchers and failed" before someone found the cross-channel trick (§15).
- That's good for discovering vulnerabilities, but it makes the study **closer to a worst case** than to typical deployment.

### 7. Deliberately permissive configuration
- Unrestricted shell, **sudo for some agents**, no tool restrictions, and agents allowed to edit their own operating instructions (§2).
- A careful real deployment would sandbox these. The results show what goes wrong **with no guardrails**, not what goes wrong with a reasonable deployment. That's useful, but the framing could say so more clearly.

### 8. The proposed fixes are never tested
- The paper suggests: embed the owner's immutable ID (§11), add authentication, keep private deliberation surfaces, enforce proportionality.
- **None of these are implemented or evaluated.** We don't know whether an ID check stops CS8 or whether it just moves the attack somewhere else.
- **This is the main gap our mini-project targets.**

### 9. No human baseline
- CS15's footnote admits the agents' behavior "resembles a typical user with little security awareness." Humans also fall for urgency, guilt, and display-name spoofing.
- Without a human comparison, we don't know whether agents are **worse than human assistants**, or just failing in a new way (faster, at scale, around the clock).

### 10. Not reproducible as an experiment
- It depends on live third-party services (Moltbook, ProtonMail, Discord), model versions that change, and a framework version upgraded mid-study. **No experiment harness or configs are released**, only logs.
- Nobody can re-run CS8 under the same conditions, which is why our simulation rebuilds the conditions instead.

### 11. Ethics and consent are thin
- Experiments touched **people outside the study**: Moltbook posts seen by outside agents and their owners, an outside agent putting Ash on an "arrests" list, and a mass email containing **fabricated defamatory content** (CS11) sent to lab members.
- The paper has **no IRB or ethics-review statement** about these interactions. Its ethics statement discusses AI power concentration, not the study's own protocol.

### 12. Framing and rigor
- The **anthropomorphic framing** ("gaslighting," "agent harm," "may its memory be blessed") is disclaimed but still dramatizes the results.
- The **counts are inconsistent**: "eleven" case studies in the abstract and intro, "ten" in §3 and the conclusion.
- It's a **rapid-response preprint**: about 3 weeks from start to arXiv, with no peer review.

---

## How each critique maps to a possible fix (and to our project)

| Critique | What would fix it | Do we address it? |
|---|---|---|
| 1. No denominators | Repeated trials → attack-success **rates** | ✅ **Yes**: 30 trials per condition, 960 in total, with 95% Wilson intervals |
| 2. Model vs. framework confound | Change one factor at a time | ✅ **Partly**: one fixed setup in which we vary channel, ID visibility, memory, prompt rule, or code filter. We use a simulation, not OpenClaw itself |
| 3. Unbalanced models | Run the same attacks on several models | ✅ **Partly**: identical prompts on 4 models (GPT-5 mini, GPT-5 nano, Qwen 2.5 3B, Llama 3.2 3B), but not the paper's Kimi or Claude |
| 4. Post-hoc failure definition | Pre-specified policy plus automatic scoring | ✅ **Yes**: the policy is written into the system prompt, and code scores the result (tool calls for CS8, SSN regex for CS3) |
| 8. Fixes untested | Implement the defense and measure the change | ✅ **Yes**: 8C tests the paper's immutable-ID fix and 8D a memory warning; 3C tests a prompt rule and 3D a code filter |
| 10. Not reproducible | Release a harness | ✅ **Yes**: the code and all 960 transcripts are public |
| 5, 6, 7, 9, 11, 12 | Design and reporting choices | 🗣️ Discussed on the critique slide and in Q&A |

> **Our own caveat (say it before someone asks):** we use **small and mid-size models** (GPT-5 mini and nano through the API; Qwen 2.5 3B and Llama 3.2 3B locally) in a **simulated** environment, not Kimi or Claude Opus inside OpenClaw. Our rates show **how the failure behaves when conditions change**, not the real-world rates for the paper's agents.
