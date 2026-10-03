import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Eye } from '../types'
import {
  KIND,
  blankEye,
  canvas,
  classifyTool,
  clamp,
  encode,
  findPngBase64,
  findPngPath,
  hex,
  parseTestCounts,
  scene,
  topicMeta,
  topicsOf,
  C,
} from './lib'

type D = EngineInterface

const PANE = 'visualize'
const OPEN = { id: PANE, title: 'Agent eyes', holdToasts: true, rows: 80, columns: 240 } as const

const eyes = atom({ plugin: 'visualize', key: 'eyes' } as const, {} as Record<string, Eye>)
const tick = atom({ plugin: 'visualize', key: 'tick' } as const, 0)

// Bulk / transient values live at module scope (a reload just loses them).
const shots = new Map<string, string>()
const labels = new Map<string, string>()
const bufs = new Map<string, string>()
let toldAboutGrid = false

async function labelFor($: D, id: string): Promise<string> {
  if (id === 'main') return 'main'
  let l = labels.get(id)
  if (!l) {
    try {
      for (const a of await $.agent.list()) labels.set(a.id, `${a.type}: ${a.description}`.slice(0, 28))
    } catch {
      // fall through to the generic label
    }
    l = labels.get(id) ?? `agent ${id.slice(0, 6)}`
  }
  return l
}

type EyePatch = Partial<Eye> & { hist?: string }

// Every scene stays up for at least DWELL ms, so a fast tool call is still readable.
// Scene changes queue per agent; follow-up patches (result, topics, done) ride the newest queued scene.
const DWELL = 1000
const queues = new Map<string, EyePatch[]>()
const shownAt = new Map<string, number>()
const scheduled = new Set<string>()

async function apply($: D, id: string, p: EyePatch) {
  const label = await labelFor($, id)
  const t = await read($, tick)
  const { hist, ...rest } = p
  if (rest.kind !== undefined) shownAt.set(id, await $.clock.now())
  await update($, eyes, m => {
    const cur = m[id] ?? blankEye(id, label)
    const next: Eye = { ...cur, ...rest, label }
    if (rest.kind !== undefined) next.since = t
    if (rest.lastFile !== undefined) next.lastAt = t
    if (hist) next.history = [...cur.history, hist].slice(-8)
    return { ...m, [id]: next }
  })
  if (id !== 'main' && !toldAboutGrid) {
    toldAboutGrid = true
    $.ui.toast('visualize: subagents running. /visualize shows every agent at once.')
  }
}

function schedule($: D, id: string, ms: number) {
  if (scheduled.has(id)) return
  scheduled.add(id)
  $.clock.after(Math.max(0, ms), () => flush($, id))
}

async function flush($: D, id: string) {
  scheduled.delete(id)
  const q = queues.get(id) ?? []
  const head = q.shift()
  if (!head) return
  await apply($, id, head)
  if (q.length > 0) schedule($, id, DWELL)
}

async function patch($: D, id: string, p: EyePatch) {
  const q = queues.get(id) ?? []
  if (p.kind === undefined) {
    if (q.length > 0) q[q.length - 1] = { ...q[q.length - 1], ...p }
    else await apply($, id, p)
    return
  }
  const wait = (shownAt.get(id) ?? 0) + DWELL - (await $.clock.now())
  if (q.length === 0 && wait <= 0) {
    await apply($, id, p)
    return
  }
  q.push(p)
  queues.set(id, q)
  schedule($, id, wait)
}

// header + detail + topics lines under/over each raster
const CARD_TEXT_ROWS = 3

type UI = ReturnType<D['ui']['resolve']> extends infer R ? any : never

function card(UI: UI, eye: Eye, t: number, cols: number, rows: number, extra: boolean, key: string) {
  const { Box, Text, Raster, Image } = UI
  const meta = KIND[eye.kind]
  const c = canvas(cols, rows)
  scene(c, eye, t)
  const shot = eye.hasShot ? shots.get(eye.id) : undefined
  const live = !eye.done && eye.kind !== 'idle'
  return (
    <Box key={key} flexDirection="column" width={cols}>
      <Box flexDirection="row" gap={1}>
        <Text color={hex(live ? meta.color : C.dim)}>{live ? '●' : '○'}</Text>
        <Text bold>{eye.label}</Text>
        <Text color={hex(meta.color)}>{eye.done ? `${meta.label} · done` : meta.label}</Text>
      </Box>
      {shot ? (
        <Image key={`shot-${eye.id}`} source={{ png: shot }} columns={cols} rows={rows} alt=" " />
      ) : (
        <Raster key={`eye-${eye.id}`} columns={cols} rows={rows} cells={encode(c)} />
      )}
      <Text dimColor wrap="end">{eye.detail || ' '}</Text>
      <Box flexDirection="row" gap={1}>
        {eye.topics.length === 0 ? <Text dimColor> </Text> : eye.topics.map(n => <Text key={`tp-${n}`} color={hex(topicMeta(n).color)}>#{n}</Text>)}
      </Box>
      {extra &&
        eye.history.slice(-3).map((entry, k) => (
          <Text key={`h-${k}`} dimColor wrap="end">
            {entry}
          </Text>
        ))}
    </Box>
  )
}


export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'visualize', description: 'Open the visualize grid: what the main agent and every subagent is doing' })
    await update($, eyes, m => (m.main ? m : { ...m, main: blankEye('main', 'main') }))
    void $.ui.open(OPEN)
    $.clock.every(125, async () => {
      const m = await read($, eyes)
      if (Object.values(m).some(x => !x.done && x.kind !== 'idle')) await update($, tick, n => n + 1)
    })

    return next(e)
  })

  on('command.run', { command: 'visualize' }, async $ => {
    await $.ui.open({ ...OPEN, focus: true, closeOnEscape: true })
    return { text: 'visualize opened (Esc closes it).' }
  })

  on('prompt.submit', async ($, e, next) => {
    bufs.set('main', e.text)
    queues.clear()
    shots.clear()
    await update($, eyes, m => {
      const kept: Record<string, Eye> = {}
      for (const [id, x] of Object.entries(m)) if (id === 'main' || !x.done) kept[id] = x
      return kept
    })
    await patch($, 'main', { topics: topicsOf(e.text), kind: 'think', detail: 'reading your prompt', done: false, hasShot: false, result: '' })
    return next(e)
  })

  // The model is generating: thinking / answer text drives the topic chips and the "think" scene.
  on('turn.step', async function* ($, e, next) {
    const id = e.agentId ?? 'main'
    await patch($, id, { kind: 'think', detail: 'thinking', done: false, result: '', hasShot: false })
    shots.delete(id)
    let since = 0
    for await (const chunk of next(e)) {
      if (chunk.kind === 'thinking' || chunk.kind === 'text') {
        const buf = ((bufs.get(id) ?? '') + chunk.text).slice(-700)
        bufs.set(id, buf)
        since += chunk.text.length
        if (since > 400) {
          since = 0
          await patch($, id, { topics: topicsOf(buf) })
        }
      }
      yield chunk
    }
  })

  on('tool.call', async ($, e, next) => {
    const id = e.agentId ?? 'main'
    const input = e as unknown as Record<string, any>
    const p = classifyTool(e.tool, input)
    if (p.kind !== 'browser') shots.delete(id)
    await patch($, id, { ...p, result: '', done: false, hasShot: p.kind === 'browser' ? (shots.has(id)) : false })

    const ran = await next(e)
    if (ran.deny !== undefined) return ran

    const text = typeof ran.text === 'string' ? ran.text : ''
    const fail = ran.isError === true
    const after: Partial<Eye> = { result: fail ? 'fail' : 'ok' }
    if (p.kind === 'test') {
      const counts = parseTestCounts(text)
      if (counts) Object.assign(after, counts)
    }
    if (p.kind === 'browser' || p.kind === 'bash') {
      let b64 = findPngBase64((ran as { result?: unknown }).result)
      if (!b64) {
        const path = findPngPath(text) ?? findPngPath(JSON.stringify(input).slice(0, 2000))
        if (path) {
          try {
            const got = (await $.fs.read(path, { as: 'bytes' })) as any
            const raw: string | undefined = got?.base64 ?? got?.bytes?.toBase64?.()
            if (raw && raw.length < 2_700_000) b64 = raw
          } catch {
            // no screenshot file; keep the drawn feed
          }
        }
      }
      if (b64) {
        shots.set(id, b64)
        after.hasShot = true
      }
    }
    await patch($, id, after)
    return ran
  })

  on('turn.complete', async ($, e, next) => {
    const id = e.agentId ?? 'main'
    // Keep the last scene on screen; just stop animating it.
    await patch($, id, { done: true })
    return next(e)
  })

  // ------------------------------------------------------------- drawing

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    if (e.surface !== 'terminal') {
      const { Text } = $.ui.resolve(e)
      return <Text>visualize draws on the terminal surface.</Text>
    }
    const UI = $.ui.resolve(e)
    const { Box } = UI
    const map = await read($, eyes)
    const t = await read($, tick)
    const list = [map.main ?? blankEye('main', 'main'), ...Object.values(map).filter(x => x.id !== 'main')]
    const n = list.length

    // One agent fills the pane; more tile it as evenly as possible (1, 2x1, 2x2, 3x2, 3x3, ...).
    const gc = Math.ceil(Math.sqrt(n))
    const gr = Math.ceil(n / gc)
    const props = e.props as { bodyColumns?: number; scroll?: { bodyRows?: number } }
    const bodyCols = props.bodyColumns ?? 120
    const bodyRows = props.scroll?.bodyRows ?? Math.max(8, (e.viewport?.rows ?? 40) - 4)
    const gap = 1
    const cellW = clamp(Math.floor((bodyCols - (gc - 1) * gap) / gc), 8, 500)
    const cellRows = clamp(Math.floor(bodyRows / gr) - CARD_TEXT_ROWS, 2, 250)
    const rowsOfCards: Eye[][] = []
    for (let i = 0; i < n; i += gc) rowsOfCards.push(list.slice(i, i + gc))

    return (
      <Box flexDirection="column">
        {rowsOfCards.map((r, ri) => (
          <Box key={`row-${ri}`} flexDirection="row" gap={gap}>
            {r.map(x => card(UI, x, t, cellW, cellRows, false, `g-${x.id}`))}
          </Box>
        ))}
      </Box>
    )
  })
}
