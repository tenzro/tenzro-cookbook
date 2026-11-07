# Contributing

One rule: **a recipe must be tested before you open a PR.** Install the real package, run the real snippet, and say in the recipe's "What was verified" section exactly what you ran and what you saw. If you could not run something, say so; do not present it as working.

Each recipe is one markdown file in `recipes/` with a short intro, a language-tagged code block, a "What was verified" section and a link to its source. Add it to the table in `README.md`.

Do not put secrets, private keys or real account addresses in a recipe. CI checks that Python blocks parse, JSON blocks are valid, JavaScript/TypeScript-compatible blocks pass `node --check`, bash blocks pass `bash -n`, and every recipe has a "What was verified" section and a Source link. Run it locally with `python3 scripts/check_recipes.py`.
