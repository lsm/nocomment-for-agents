# nocomment-for-agents

Zero-comments policy tools for agent-maintained repositories: source files carry **zero comments** — rationale lives in commit messages, PR descriptions, and docs, not in code. These utilities enforce and apply that policy. Mirrors the house policies of lsm/HyperNeo, lsm/hyperneo-review, and lsm/makai.

## go/ — the Go checker and stripper

A literal-aware Go comment scanner with a structural load-bearing guard (AST parse → strip → reprint for `--write`, so compiler directives and other load-bearing comment forms survive by construction).

```
go run ./go --check            # exit 1 listing violating files
go run ./go --write            # strip comments in place (AST reprint)
go run ./go --stats            # per-file comment counts
```

- Exemptions: toolchain-honored directives only (`//go:build`, `// +build`, `//go:embed` line-start forms, `//go:generate`, `//nolint`). A **bare** `//nolint` is kept but makes the file unstrippable — `go/printer` rewrites it as `// nolint`, which deactivates it, so `--write` refuses the file and says to use the colon form (`//nolint:all`).
- `--check` additionally skips what `--write` can never remove, and only where the toolchain honors it: an `// Output:` block inside an `Example` function body, a `Code generated ... DO NOT EDIT.` header before the package clause, a canonical import comment on the package clause, and a cgo preamble. These are executable, not prose — counting them would strand a file on the allowlist with no edit that could clear it. Position is part of the test, so prose that merely opens with "Output:" is counted like any other sentence, as are directive lookalikes. The import comment must also be one: a quoted path and nothing after it, so `// import "C" would make this cgo...` is prose and is counted.
- Ratchet: `allowlist.txt` (one path per line, shrink-only) — `--check` fails on comments in any file NOT on the allowlist; a file's entry is removed when its comments are.
- CI: `go run ./go --check` as a pipeline step; this repo runs it on itself in `.github/workflows/ci.yml`.

## ts/ — the TypeScript stripper

`strip-comments.mjs` — the TS-parser-based scanner (literal-aware, comment-marker-safe) refined in lsm/superpipe. See the file header for usage.

```
npm install
npm test                                   # node --test over ts/*.test.mjs
node ts/strip-comments.mjs --check         # exit 1 if any tracked source still has comments
node ts/strip-comments.mjs --files a.tsx   # strip named files in place
```

It covers `.ts`, `.tsx`, `.mts` and `.cts`, parsing each by extension so a `.tsx` file is parsed as TSX. Pragmas a tool honours are exempt: shebangs, `/// <reference>`, `@ts-*`, lint disables, coverage ignores, `prettier-ignore`, `@license`/`@preserve`, JSX pragmas, webpack magic comments and `@vite-ignore`.

## Adoption

- **hyperneo-review**: origin of the Go tool (`tools/nocomment`, enforced in CI since 2026-09-11); this repo is now the canonical home — consumers vendor or module-reference it.
- **dolmen**: use the Go tool directly for its pending zero-comments tasks.
- New repos: copy `go/` (or `ts/`), seed `allowlist.txt` with currently-commented files, add `--check` to CI, strip package by package.

## Policy notes

- Comments rot; teaching lives in docs and history. The tools make the policy mechanical.
- Load-bearing comment forms (compiler directives, `//nolint`) are exempt by toolchain semantics, not by taste — the Go `--write` mode is AST-based precisely so the exemption set cannot drift from the toolchain.
