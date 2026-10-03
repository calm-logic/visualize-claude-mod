import { expect, mock, test } from 'claude-code/testing'

const strings = (n: unknown, out: string[] = []): string[] => {
  if (typeof n === 'string') out.push(n)
  else if (Array.isArray(n)) n.forEach(x => strings(x, out))
  else if (n && typeof n === 'object') {
    const o = n as { children?: unknown; props?: { children?: unknown } }
    strings(o.children ?? o.props?.children, out)
  }
  return out
}

const READ = { result: { type: 'text', file: { filePath: '/a/b.ts', content: 'x', numLines: 1, startLine: 1, totalLines: 1 } }, text: 'x' }
const BASH = { result: { stdout: 'ok', stderr: '', interrupted: false }, text: 'ok' }

test('scenes follow tool calls, each held for at least a second, and the last one stays', async ($, on) => {
  const clock = mock.clock(on)
  on('tool.call', async (_$, e) => (e.tool === 'Read' ? READ : BASH) as never)
  await clock.advance(5000)

  const shown = async () => {
    const m = await $.ui.mount({ plugin: 'visualize', surface: 'terminal', component: 'Pane', requestId: 'visualize', props: { bodyColumns: 60 } as never, viewport: { columns: 100, rows: 30, isFullscreen: false } as never })
    const text = strings(await m.drawn()).join(' ')
    await m.unmount()
    return text
  }

  await $.tool.call({ tool: 'Read', file_path: '/a/b.ts' } as never)
  expect(await shown()).toContain('READING')

  await $.tool.call({ tool: 'Bash', command: 'ls' } as never)
  expect(await shown()).toContain('READING') // too soon: the read scene is still held

  await clock.advance(1100)
  expect(await shown()).toContain('RUNNING')
})
