"""CLI: python -m hsup.cli input.json [--output result.json]"""
import argparse, json
from pathlib import Path
from .core import Evidence, run_hsup

def main():
    p = argparse.ArgumentParser(description="Run the HSUP reference pipeline on supplied evidence")
    p.add_argument("input", help="JSON with question, initial_answer, evidence[]")
    p.add_argument("--output", help="write JSON output to this path (default: stdout)")
    args = p.parse_args()
    data = json.loads(Path(args.input).read_text(encoding="utf-8-sig"))
    evidence = [Evidence(**item) for item in data.get("evidence", [])]
    result = run_hsup(data["question"], data["initial_answer"], evidence).to_dict()
    rendered = json.dumps(result, indent=2, ensure_ascii=False)
    if args.output:
        Path(args.output).write_text(rendered + "\n", encoding="utf-8-sig")
    else:
        print(rendered)
if __name__ == "__main__": main()

