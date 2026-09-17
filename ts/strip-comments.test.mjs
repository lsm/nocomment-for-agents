import assert from 'node:assert/strict'
import { test } from 'node:test'
import { scriptKindName, stripComments } from './strip-comments.mjs'

test('strips line, block and JSDoc comments', () => {
  const src = 'const a = 1 // trailing\n/* block */\n/** doc */\nexport const b = 2\n'
  const out = stripComments(src, 'x.ts')
  assert.ok(!out.includes('trailing'))
  assert.ok(!out.includes('block'))
  assert.ok(!out.includes('doc'))
  assert.ok(out.includes('const a = 1'))
  assert.ok(out.includes('export const b = 2'))
})

test('a comment marker inside a string or template is not a comment', () => {
  for (const src of [
    'const u = "https://example.com/x"\n',
    'const t = `a // b ${x} /* c */ d`\n',
    "const r = /https:\\/\\/x/\n",
  ]) {
    assert.equal(stripComments(src, 'x.ts'), src, `mangled: ${src}`)
  }
})

test('a // inside a JSX attribute is not treated as a comment', () => {
  const src = 'export const A = () => <a href="https://example.com/x">hi</a>\n'
  assert.equal(stripComments(src, 'A.tsx'), src)
})

test('a JSX expression comment is removed from a .tsx file', () => {
  const src = 'export const A = () => (\n  <div>\n    {/* gone */}\n    <b>kept</b>\n  </div>\n)\n'
  const out = stripComments(src, 'A.tsx')
  assert.ok(!out.includes('gone'))
  assert.ok(out.includes('<b>kept</b>'))
})

test('keeps the pragmas a tool honours', () => {
  const kept = [
    '// @ts-expect-error nope\n',
    '// eslint-disable-next-line no-eval\n',
    '/// <reference types="node" />\n',
    '// prettier-ignore\n',
    '/* @license MIT */\n',
    '/* @preserve keep me */\n',
    '/** @jsxImportSource preact */\n',
    'import(/* webpackChunkName: "x" */ "./x")\n',
    'import(/* @vite-ignore */ url)\n',
    '// biome-ignore lint: nope\n',
  ]
  for (const src of kept) {
    const out = stripComments(src + 'const x = 1\n', 'x.tsx')
    assert.ok(out.includes(src.trim()), `dropped a load-bearing pragma: ${src.trim()}`)
  }
})

test('a shebang survives', () => {
  const src = '#!/usr/bin/env node\nconst x = 1\n'
  assert.ok(stripComments(src, 'cli.ts').startsWith('#!/usr/bin/env node'))
})

test('stripping is idempotent', () => {
  const src = '// a\nconst x = 1 /* b */\n// c\nexport default x\n'
  const once = stripComments(src, 'x.ts')
  assert.equal(stripComments(once, 'x.ts'), once)
})

test('an unterminated block comment is reported, not silently swallowed', () => {
  assert.throws(() => stripComments('const x = 1\n/* never closed\n', 'x.ts'), /unterminated|never closed|\*\//i)
})

test('tsx and jsx files are parsed as such', () => {
  for (const [name, kind] of [
    ['A.tsx', 'TSX'],
    ['A.jsx', 'JSX'],
    ['a.ts', 'TS'],
    ['a.mjs', 'JS'],
  ]) {
    assert.equal(scriptKindName(name), kind, name)
  }
})
