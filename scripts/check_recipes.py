#!/usr/bin/env python3
"""Syntax-check fenced code blocks in recipes/*.md. Does not execute any snippet.
python -> ast.parse; json -> json.loads; bash -> bash -n;
typescript -> node --check as ESM (only if node is on PATH).
Rust blocks are skipped: recipe snippets need a crate to compile against.
Each recipe must also have a 'What was verified' heading and a 'Source' link."""
import ast, json, pathlib, re, shutil, subprocess, sys, tempfile

FENCE = re.compile(r"^```(\w+)\n(.*?)^```", re.S | re.M)
fail = 0
for f in sorted(pathlib.Path("recipes").glob("*.md")):
    text = f.read_text()
    if "What was verified" not in text and "no code on purpose" not in text:
        print(f"{f}: missing 'What was verified'"); fail += 1
    if not re.search(r"^Source: .*\(https://", text, re.M):
        print(f"{f}: missing Source link"); fail += 1
    for lang, body in FENCE.findall(text):
        try:
            if lang == "python":
                ast.parse(body)
            elif lang == "json":
                json.loads(body)
            elif lang == "bash":
                subprocess.run(["bash", "-n"], input=body.encode(), check=True, capture_output=True)
            elif lang in ("typescript", "ts") and shutil.which("node"):
                with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False) as t:
                    t.write(body)
                subprocess.run(["node", "--check", t.name], check=True, capture_output=True)
        except Exception as e:
            print(f"{f}: {lang} block failed: {getattr(e, 'stderr', e)}"); fail += 1
print("FAIL" if fail else "ok")
sys.exit(1 if fail else 0)
