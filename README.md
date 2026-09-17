# nocomment-for-agents

Zero-comments policy tools for agent-maintained repositories: source files carry **zero comments** — rationale lives in commit messages, PR descriptions, and docs, not in code. These utilities enforce and apply that policy. Mirrors the house policies of lsm/HyperNeo, lsm/hyperneo-review, and lsm/makai.

## go/ — the Go checker and stripper

A literal-aware Go comment scanner with a structural load-bearing guard (AST parse → strip → reprint for `--write`, so compiler directives and other load-bearing comment forms survive by construction).

```
go run ./go --check            # exit 1 listing violating files
go run ./go --write            # strip comments in place (AST reprint)
go run ./go --stats            # per-file comment counts
```

- Exemptions: toolchain-honored directives only (`//go:build`, `// +build`, `//go:embed` line-start forms, `//go:generate`, `//nolint`).
- `--check` additionally skips what `--write` can never remove: an example's `// Output:` block, a `Code generated ... DO NOT EDIT.` header, and a cgo preamble. These are executable, not prose — counting them would strand a file on the allowlist with no edit that could clear it. Directive lookalikes stay counted, because deleting those is just an edit.
- Ratchet: `allowlist.txt` (one path per line, shrink-only) — `--check` fails on comments in any file NOT on the allowlist; a file's entry is removed when its comments are.
- CI: `go run ./go --check` as a pipeline step; this repo runs it on itself in `.github/workflows/ci.yml`.

## ts/ — the TypeScript stripper

`strip-comments.mjs` — the TS-parser-based scanner (literal-aware, comment-marker-safe) refined in lsm/superpipe. See the file header for usage.

## Adoption

- **hyperneo-review**: origin of the Go tool (`tools/nocomment`, enforced in CI since 2026-09-11); this repo is now the canonical home — consumers vendor or module-reference it.
- **dolmen**: use the Go tool directly for its pending zero-comments tasks.
- New repos: copy `go/` (or `ts/`), seed `allowlist.txt` with currently-commented files, add `--check` to CI, strip package by package.

## Policy notes

- Comments rot; teaching lives in docs and history. The tools make the policy mechanical.
- Load-bearing comment forms (compiler directives, `//nolint`) are exempt by toolchain semantics, not by taste — the Go `--write` mode is AST-based precisely so the exemption set cannot drift from the toolchain.
