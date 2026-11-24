"""Small, dependency-free HSUP reference implementation.

The default verifier is intentionally conservative lexical matching. It is a
runnable demonstration, not a semantic fact checker. Replace EvidenceVerifier
with an entailment model or human review for research-grade use.
"""
from dataclasses import dataclass, asdict
import re
from typing import Iterable, Protocol

STOP = set("a an the is are was were be been being to of in on at by for from with and or but as it this that these those their its has have had do does did can may might will would should according reported said".split())

@dataclass(frozen=True)
class Evidence:
    id: str
    text: str
    source: str = ""

@dataclass
class ClaimResult:
    claim: str
    status: str
    confidence: float
    evidence_ids: list[str]
    rationale: str

@dataclass
class HSUPResult:
    question: str
    initial_answer: str
    final_answer: str
    claims: list[ClaimResult]
    limitations: list[str]

    def to_dict(self):
        return asdict(self)

class EvidenceVerifier(Protocol):
    def verify(self, claim: str, evidence: list[Evidence]) -> ClaimResult: ...

def split_claims(text: str) -> list[str]:
    """Approximate claim segmentation; preserve sentence text for auditability."""
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", text.strip()) if s.strip()]

def terms(text: str) -> set[str]:
    return {w for w in re.findall(r"[\w'-]+", text.lower()) if len(w) > 2 and w not in STOP}

class LexicalEvidenceVerifier:
    """Transparent heuristic baseline. Similarity is not entailment."""
    def __init__(self, support_threshold: float = 0.30, contradiction_threshold: float = 0.30):
        self.support_threshold = support_threshold
        self.contradiction_threshold = contradiction_threshold

    def verify(self, claim: str, evidence: list[Evidence]) -> ClaimResult:
        cterms = terms(claim)
        if not cterms or not evidence:
            return ClaimResult(claim, "unverified", 0.0, [], "No usable claim terms or evidence supplied.")
        scores = []
        for item in evidence:
            eterms = terms(item.text)
            overlap = len(cterms & eterms) / max(1, len(cterms))
            scores.append((overlap, item))
        best, item = max(scores, key=lambda pair: pair[0])
        if best < self.support_threshold:
            return ClaimResult(claim, "unverified", round(best, 3), [], "No source has enough lexical overlap; this is not proof the claim is false.")
        neg_claim = bool(re.search(r"\b(not|never|no|didn't|doesn't|isn't|wasn't|cannot)\b", claim.lower()))
        neg_evidence = bool(re.search(r"\b(not|never|no|didn't|doesn't|isn't|wasn't|cannot)\b", item.text.lower()))
        if neg_claim != neg_evidence and best >= self.contradiction_threshold:
            return ClaimResult(claim, "contradicted", round(best, 3), [item.id], "Negation differs in the closest-overlap source; manual review is recommended.")
        return ClaimResult(claim, "supported", round(best, 3), [item.id], "Lexical overlap found; semantic entailment has not been established.")

def revise(answer: str, claims: list[ClaimResult]) -> str:
    by_claim = {c.claim: c for c in claims}
    output = []
    for sentence in split_claims(answer):
        result = by_claim[sentence]
        if result.status == "supported":
            output.append(f"{sentence} [Evidence: {', '.join(result.evidence_ids)}]")
        elif result.status == "contradicted":
            output.append(f"{sentence} [CONFLICT: {', '.join(result.evidence_ids)}; requires review]")
        else:
            output.append(f"{sentence} [Unverified from supplied sources]")
    return " ".join(output)

def run_hsup(question: str, initial_answer: str, evidence: Iterable[Evidence], verifier: EvidenceVerifier | None = None) -> HSUPResult:
    ev = list(evidence)
    verifier = verifier or LexicalEvidenceVerifier()
    claims = [verifier.verify(c, ev) for c in split_claims(initial_answer)]
    final = revise(initial_answer, claims) if claims else "Insufficient information to answer."
    return HSUPResult(question, initial_answer, final, claims, ["Claim segmentation is sentence-based and may miss multi-claim sentences.", "The default lexical verifier cannot establish semantic entailment or source reliability.", "Contradiction detection only uses simple negation cues; unresolved claims should be reviewed."])
