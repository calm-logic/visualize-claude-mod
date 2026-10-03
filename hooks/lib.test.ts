import { expect, test } from 'claude-code/testing'

import { blankEye, canvas, classifyTool, encode, parseTestCounts, scene, topicsOf } from './lib'

test('classifies file, test and browser calls', async () => {
  expect(classifyTool('Read', { file_path: '/a/b/c.ts' }).kind).toBe('read')
  expect(classifyTool('Edit', { file_path: '/a/b/c.ts', new_string: 'x' }).kind).toBe('edit')
  expect(classifyTool('Bash', { command: 'npx vitest run' }).kind).toBe('test')
  expect(classifyTool('Bash', { command: 'ls' }).kind).toBe('bash')
  expect(classifyTool('mcp__Claude_Browser__navigate', { url: 'https://x.dev' }).kind).toBe('browser')
})

test('keywords become topics', async () => {
  expect(topicsOf('the test is failing, a bug in the auth token')[0]).toBeDefined()
  expect(topicsOf('hello there')).toEqual([])
})

test('parses test counts', async () => {
  expect(parseTestCounts('Tests: 2 failed, 8 passed')).toEqual({ passed: 8, failed: 2 })
})

test('every scene encodes to a full grid', async () => {
  for (const kind of ['idle', 'think', 'read', 'write', 'edit', 'search', 'bash', 'test', 'browser', 'web', 'agent', 'plan', 'tool'] as const) {
    const c = canvas(40, 10)
    scene(c, { ...blankEye('main', 'main'), kind, path: '/x/y.ts', detail: 'd', topics: ['debug'] }, 17)
    expect(atob(encode(c)).length).toBe(40 * 10 * 12)
  }
})

test('every thinking animation and the file badge render', async () => {
  for (let age = 0; age < 1400; age += 200) {
    const c = canvas(60, 14)
    scene(c, { ...blankEye('main', 'main'), kind: 'think', since: 0, topics: ['debug', 'test'], lastOp: 'R', lastFile: 'users.tsx', lastAt: 0 }, age)
    expect(atob(encode(c)).length).toBe(60 * 14 * 12)
  }
})
