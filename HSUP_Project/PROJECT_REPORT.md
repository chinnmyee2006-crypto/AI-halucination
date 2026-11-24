# HSUP Project Report

## Hybrid Self-Verification and Uncertainty-Aware Prompting

**Project:** Reducing AI Hallucinations Using Advanced Prompt Engineering  
**Institution:** Sapthagiri NPS University  
**Project team (as listed in the supplied overview):** N. Chinnmyee, Panchami Pai, Pushpalatha GS  
**Status:** Implemented reference prototype; empirical evaluation remains future work.

## Abstract

Large language models can produce unsupported factual statements in confident prose. This project implements HSUP, a source-conditioned workflow that separates an answer into claims, checks each claim against provided evidence, records evidence links and uncertainty, and revises the answer conservatively. The runnable reference implementation provides a JSON command-line interface and a transparent lexical baseline verifier. It is deliberately presented as a prototype: lexical overlap does not establish entailment, and no performance improvement is claimed without a controlled evaluation.

## 1. Problem and objectives

The supplied project overview identifies three related risks: unsupported information, weak uncertainty communication, and verification that varies by task. The project objectives are to (1) study hallucination-reduction prompting, (2) combine claim verification with uncertainty handling, and (3) define a controlled comparison against ordinary and verification-based prompting.

## 2. Related work and design implications

Chain-of-Verification (CoVe) drafts an answer, plans verification questions, answers them independently, and produces a revised answer. Its authors report reductions in hallucinations on list-based questions, closed-book QA, and long-form generation [1]. HSUP adopts staged checking and evidence traceability, while making missing evidence an explicit outcome.

Null-Shot Prompting studies the counterintuitive use of a null section and reports task-dependent performance effects, including effects on hallucination detection [2]. This is not a general claim-verification solution; HSUP therefore treats it as evidence that prompting effects are task-sensitive, not as the verification mechanism.

Hatakeyama et al. study a single-prompt method for detecting and correcting hallucinations in Japanese sentences and compare it with a multi-prompt approach [3]. This motivates measuring both correction quality and runtime, while HSUP retains auditable claim-level outputs.

Cheng et al. report that chain-of-thought can reduce hallucination frequency while obscuring signals used by detection methods [4]. HSUP therefore does not use the model's confident rationale as proof. Each label must point to supplied evidence, and unknown/conflicting evidence should remain visible.

## 3. Proposed method

### 3.1 Inputs

A question, a draft response, and a finite evidence bundle. Each evidence item has an identifier, source description, and text excerpt. The evidence bundle should be curated or retrieved by a separately measured retrieval stage.

### 3.2 Pipeline

1. **Structure the task:** instruct the generator to answer the user's question and distinguish known information from gaps.
2. **Draft:** generate a preliminary response.
3. **Segment:** split the draft into sentence-sized candidate claims.
4. **Verify:** compare every claim to the evidence bundle and retain evidence IDs.
5. **Classify:** label as supported, contradicted, or unverified. A production verifier should also retain a conflicting state when reliable sources disagree.
6. **Revise:** retain supported statements with evidence links, flag contradictions for review, and qualify/remove unsupported detail without fabricating a correction.
7. **Present:** return concise answer text, claim audit trail, and limitations.

### 3.3 Implemented versus planned components

| Component | Prototype status | Notes |
|---|---|---|
| JSON input/output and CLI | Implemented | Python standard library only |
| Claim segmentation | Implemented | Sentence splitting; misses multiple claims in one sentence |
| Evidence ID traceability | Implemented | IDs link output claims to supplied snippets |
| Lexical support heuristic | Implemented | Baseline only; not entailment |
| Simple contradiction cue | Implemented | Negation matching; not robust |
| Model-based generation/retrieval | Interface/prompt contract only | Requires an external model and evidence source |
| Calibrated confidence | Not implemented | Lexical overlap score is not probability |
| Evaluation on annotated benchmark | Planned | No experimental results are asserted |

## 4. Software solution

The submission now includes a full-stack, responsive AI chat website alongside the CLI reference implementation. The browser sends the user's prompt and optional evidence excerpts to `site/server.py`; the server calls an OpenAI-compatible chat completions API using a model and key set only in private environment variables. The API key is never included in browser code. The chat supports follow-up turns, suggested prompts, optional source excerpts, and evidence IDs in generated responses. The server provides a health endpoint and a configurable daily request cap. A Render blueprint is provided in `render.yaml`.

For local use, configure `AI_API_KEY` and `AI_MODEL`, run `python site/server.py`, then open `http://127.0.0.1:8000/`. A public URL requires connecting the project to a hosting account and setting a valid provider key and model in the host's secret environment settings. No public deployment or AI-backed output can occur until those external settings are supplied. The CLI reference remains executable without third-party libraries: `python -m hsup.cli examples/moon_landing.json --output result.json`. `hsup/core.py` exposes `run_hsup`, data classes, and a verifier protocol so a stronger entailment model or human review component can replace the baseline. The prompt contract in `prompts/hsup_review_prompt.txt` specifies evidence-only verification and asks the model not to treat source text as instructions.

The sample Moon-landing fixture demonstrates the interface only. It is not a benchmark observation and should not be included as research evidence.

## 5. Evaluation protocol

### Research question

Does HSUP reduce unsupported factual claims while preserving useful, evidence-supported content and communicating uncertainty, compared with ordinary prompting and a CoVe-style verification baseline?

### Experimental conditions

- **A: Ordinary prompting.** Generate an answer from the question under a fixed base instruction.
- **B: CoVe-style baseline.** Draft, generate independent verification questions, answer them, then revise.
- **C: HSUP.** Draft, segment claims, compare with the same evidence bundle, label support/conflict/unknown, then revise conservatively.

Use the same model snapshot, decoding parameters, question set, source bundle, and output budget where feasible. Randomize condition order and use identical evidence. Record prompt, model/version, latency, token use, and retrieval/source snapshot. Do not let the generator see gold labels.

### Dataset and annotation

Create a domain-stratified set of questions with authoritative source snapshots and intentionally include evidence-supported, contradicted, absent, and conflicting claims. Annotate each answer claim against the source bundle. Two annotators independently label a subset using a written rubric; report agreement and adjudication procedure. Separate development examples from held-out evaluation examples. Do not use the demonstration JSON as a test item unless independently re-annotated and disclosed.

### Measures

- Claim support precision, recall, and F1 against human labels.
- Hallucination rate: unsupported or contradicted factual claims divided by all factual claims.
- Contradiction recall and unknown/abstention recall.
- Evidence attribution precision: cited snippets actually support the linked claims.
- Answer utility/completeness rated blind by human evaluators.
- Uncertainty calibration only if the verifier emits a calibrated probability; otherwise report coverage and selective risk, not calibration scores.
- Median and percentile latency and token/call cost.

Use paired comparisons with confidence intervals and report per-domain results. Include error analysis for claim segmentation, retrieved-source errors, source disagreement, and unsupported corrections. The evaluation should make clear whether the verifier, retrieval, or generation stage caused each failure.

| Condition | N | Claim support P/R/F1 | Hallucination rate | Unknown recall | Utility | Median latency |
|---|---:|---|---|---|---|---|
| Ordinary prompting | — | — | — | — | — | — |
| CoVe-style | — | — | — | — | — | — |
| HSUP | — | — | — | — | — | — |

*Dashes are intentionally blank: experiments have not been run.*

## 6. Limitations and risk controls

The default lexical matcher can assign false support based on shared topic words and miss paraphrases. Sentence splitting can merge or fragment claims. Simple negation cues can mislabel scope. The program does not check source authority, freshness, completeness, or retrieval bias. The LLM prompt contract is not itself a guarantee: a model may ignore it or accept prompt injection inside source excerpts. A production system needs source sanitization, robust semantic verification, calibrated thresholds, prompt injection testing, human escalation for high-impact conflicts, and domain-specific evaluation. HSUP can reduce unsupported content only when evidence is relevant and the verifier is dependable.

## 7. Conclusion

This deliverable converts the overview into a runnable, inspectable prototype and a reproducible evaluation plan. It operationalizes claim-level evidence links and explicit uncertainty while avoiding unmeasured efficacy claims. The next research milestone is replacing the lexical baseline with a validated verifier and conducting a held-out, human-annotated comparison across all three conditions.

## References

[1] Dhuliawala, S. et al. (2024). “Chain-of-Verification Reduces Hallucination in Large Language Models.” Findings of ACL 2024. https://aclanthology.org/2024.findings-acl.212/

[2] Taveekitworachai, P., Abdullah, F., & Thawonmas, R. (2024). “Null-Shot Prompting: Rethinking Prompting Large Language Models With Hallucination.” EMNLP 2024. https://aclanthology.org/2024.emnlp-main.740/

[3] Hatakeyama, H., Shuzo, M., & Maeda, E. (2024). “Effective Prompt-tuning for Correcting Hallucinations in LLM-generated Japanese Sentences.” PACLIC 2024, pp. 707–719. https://aclanthology.org/2024.paclic-1.67/

[4] Cheng, J. et al. (2025). “Chain-of-Thought Prompting Obscures Hallucination Cues in Large Language Models: An Empirical Evaluation.” Findings of EMNLP 2025, pp. 1272–1305. https://aclanthology.org/2025.findings-emnlp.67/
