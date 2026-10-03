import type { Eye, EyeKind, Todo } from '../types'

// ---------------------------------------------------------------- palette

export const C = {
  bg: 0x0d1117,
  panel: 0x161b22,
  panel2: 0x21262d,
  line: 0x30363d,
  dim: 0x484f58,
  ink: 0x8b949e,
  paper: 0xc9d1d9,
  white: 0xf0f6fc,
  cyan: 0x56d4dd,
  green: 0x3fb950,
  amber: 0xd29922,
  red: 0xf85149,
  blue: 0x58a6ff,
  purple: 0xbc8cff,
  pink: 0xff7b72,
}

export const hex = (n: number) => '#' + n.toString(16).padStart(6, '0')

export const KIND: Record<EyeKind, { label: string; color: number; glyph: string }> = {
  idle: { label: 'IDLE', color: C.ink, glyph: '-' },
  think: { label: 'THINKING', color: C.amber, glyph: '?' },
  read: { label: 'READING', color: C.cyan, glyph: 'R' },
  write: { label: 'WRITING', color: C.green, glyph: 'W' },
  edit: { label: 'EDITING', color: C.amber, glyph: 'E' },
  search: { label: 'SEARCHING', color: C.purple, glyph: 'S' },
  bash: { label: 'RUNNING', color: C.green, glyph: '$' },
  test: { label: 'TESTING', color: C.pink, glyph: 'T' },
  browser: { label: 'BROWSING', color: C.blue, glyph: 'B' },
  web: { label: 'WEB', color: C.blue, glyph: '@' },
  agent: { label: 'DELEGATING', color: C.purple, glyph: 'A' },
  plan: { label: 'PLANNING', color: C.amber, glyph: 'P' },
  tool: { label: 'TOOL', color: C.ink, glyph: '*' },
}

// ---------------------------------------------------------------- small utils

export function hash(s: string | number): number {
  const str = String(s)
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export const fname = (p: string) => p.split('/').filter(Boolean).pop() ?? p

export function basename(p: string): string {
  const parts = p.split('/').filter(Boolean)
  return parts.slice(-2).join('/') || p
}

export function blankEye(id: string, label: string): Eye {
  return {
    id,
    label,
    kind: 'idle',
    detail: id === 'main' ? 'waiting for you' : 'starting',
    path: '',
    since: 0,
    topics: [],
    history: [],
    result: '',
    passed: 0,
    failed: 0,
    x: -1,
    y: -1,
    progress: 0,
    done: false,
    hasShot: false,
    todos: [],
    action: '',
    lastOp: '',
    lastFile: '',
    lastAt: 0,
  }
}

// ---------------------------------------------------------------- keywords -> topics

type Topic = { name: string; re: RegExp; color: number; sprite: string[] }

const SPRITES: Record<string, string[]> = {
  debug: ['#..##..#', '..####..', '.######.', '########', '#.####.#', '..####..', '.#.##.#.', '#..##..#'],
  test: ['........', '......##', '.....##.', '#...##..', '##.##...', '.###....', '..#.....', '........'],
  refactor: ['..#.....', '..##....', '#######.', '..##....', '..#..##.', '.....##.', '..#######', '.....##.'].map(r => r.slice(0, 8)),
  design: ['##..##..', '##..##..', '........', '..##..##', '..##..##', '........', '##..##..', '##..##..'],
  plan: ['#.#####.', '........', '#.#####.', '........', '#.####..', '........', '#.#####.', '........'],
  perf: ['....##..', '...##...', '..###...', '.#######', '...###..', '..##....', '.##.....', '##......'],
  security: ['..####..', '.#....#.', '.#....#.', '########', '##....##', '##.##.##', '##.##.##', '########'],
  git: ['#.......', '#..###..', '#.#...#.', '#.#...#.', '##....#.', '#...###.', '#.......', '#.......'],
  db: ['.######.', '########', '.######.', '#......#', '########', '#......#', '########', '.######.'],
  api: ['..#..#..', '..#..#..', '########', '#......#', '#......#', '########', '...##...', '...##...'],
  docs: ['######..', '#....##.', '#.##..#.', '#....###', '#.###..#', '#......#', '#.###..#', '########'],
  build: ['..####..', '.#....#.', '########', '#..##..#', '#..##..#', '########', '#......#', '########'],
  idea: ['..####..', '.#....#.', '#......#', '#......#', '.#....#.', '..####..', '..####..', '...##...'],
}

export const TOPICS: Topic[] = [
  { name: 'debug', color: C.red, sprite: SPRITES.debug!, re: /\b(bug|errors?|fail(?:s|ed|ing|ures?)?|crash\w*|stack ?trace|exception|broken|root cause|undefined|regress\w*)\b/gi },
  { name: 'test', color: C.pink, sprite: SPRITES.test!, re: /\b(tests?|specs?|assert\w*|expect\w*|coverage|vitest|jest|pytest|e2e|verif(?:y|ied|ication)|passing)\b/gi },
  { name: 'refactor', color: C.cyan, sprite: SPRITES.refactor!, re: /\b(refactor\w*|rename\w*|extract\w*|clean ?up|simplif\w*|dedupe|restructur\w*)\b/gi },
  { name: 'design', color: C.purple, sprite: SPRITES.design!, re: /\b(ui|ux|css|layout|styles?|colou?rs?|theme|components?|visual\w*|pixel\w*|animat\w*)\b/gi },
  { name: 'plan', color: C.amber, sprite: SPRITES.plan!, re: /\b(plan|steps?|approach|first|then|strategy|architecture|outline)\b/gi },
  { name: 'perf', color: C.amber, sprite: SPRITES.perf!, re: /\b(perf\w*|slow|latency|cach\w+|optimi[sz]\w*|memory|throughput)\b/gi },
  { name: 'security', color: C.red, sprite: SPRITES.security!, re: /\b(auth\w*|tokens?|secrets?|permissions?|security|credentials?|password|csrf|xss|sandbox\w*|encrypt\w*)\b/gi },
  { name: 'git', color: C.pink, sprite: SPRITES.git!, re: /\b(git|commits?|branch\w*|merge\w*|rebase|pull request|diff)\b/gi },
  { name: 'data', color: C.blue, sprite: SPRITES.db!, re: /\b(sql\w*|database|schema|migrations?|quer(?:y|ies)|postgres|table|json)\b/gi },
  { name: 'api', color: C.blue, sprite: SPRITES.api!, re: /\b(api|endpoints?|http\w*|requests?|responses?|server|websocket|rest|graphql|routes?)\b/gi },
  { name: 'docs', color: C.green, sprite: SPRITES.docs!, re: /\b(docs?|readme|comments?|document\w*|changelog|explain\w*)\b/gi },
  { name: 'build', color: C.green, sprite: SPRITES.build!, re: /\b(build\w*|compil\w+|install\w*|dependenc\w+|packages?|npm|cargo|bundl\w+|webpack|vite|deploy\w*)\b/gi },
]

export const IDEA = { name: 'idea', color: C.amber, sprite: SPRITES.idea! }

export function topicsOf(text: string): string[] {
  const scored: { name: string; n: number }[] = []
  for (const t of TOPICS) {
    const n = (text.match(t.re) ?? []).length
    if (n > 0) scored.push({ name: t.name, n })
  }
  scored.sort((a, b) => b.n - a.n)
  return scored.slice(0, 3).map(s => s.name)
}

export const topicMeta = (name: string) => TOPICS.find(t => t.name === name) ?? IDEA

// ---------------------------------------------------------------- tool call -> eye patch

export const TEST_RE = /\b(vitest|jest|pytest|mocha|playwright test|cypress run|cargo (?:test|nextest)|go test|npm (?:run )?test|pnpm (?:run )?test|yarn test|bun test|rspec|phpunit|claude plugin test)\b/
export const BROWSER_BASH_RE = /\b(playwright|puppeteer|chromium|chrome|selenium|--headless)\b/
export const BROWSER_TOOL_RE = /(browser|chrome|playwright|puppeteer|selenium|screenshot|navigate)/i

const lineCount = (s: unknown) => (typeof s === 'string' ? s.split('\n').length : 0)

export type Patch = Partial<Eye> & { kind: EyeKind; hist?: string }

export function classifyTool(tool: string, i: Record<string, any>): Patch {
  const short = (s: unknown) => String(s ?? '').replace(/\s+/g, ' ').slice(0, 80)
  switch (tool) {
    case 'Read':
      return { kind: 'read', path: i.file_path ?? '', detail: basename(i.file_path ?? '') + (i.offset ? ` @${i.offset}` : ''), progress: i.limit ?? 0, lastOp: 'R', lastFile: fname(i.file_path ?? ''), hist: `R ${basename(i.file_path ?? '')}` }
    case 'Write':
      return { kind: 'write', path: i.file_path ?? '', detail: basename(i.file_path ?? ''), progress: lineCount(i.content), lastOp: 'W', lastFile: fname(i.file_path ?? ''), hist: `W ${basename(i.file_path ?? '')}` }
    case 'Edit':
    case 'NotebookEdit':
      return { kind: 'edit', path: i.file_path ?? i.notebook_path ?? '', detail: basename(i.file_path ?? i.notebook_path ?? ''), progress: lineCount(i.new_string), lastOp: 'E', lastFile: fname(i.file_path ?? i.notebook_path ?? ''), hist: `E ${basename(i.file_path ?? i.notebook_path ?? '')}` }
    case 'Grep':
    case 'Glob':
      return { kind: 'search', path: String(i.pattern ?? ''), detail: short(i.pattern) + (i.path ? ` in ${basename(i.path)}` : ''), hist: `S ${short(i.pattern).slice(0, 24)}` }
    case 'WebFetch':
    case 'WebSearch':
      return { kind: 'web', path: String(i.url ?? i.query ?? ''), detail: short(i.url ?? i.query), hist: `@ ${short(i.url ?? i.query).slice(0, 24)}` }
    case 'Agent':
      return { kind: 'agent', detail: short(i.description ?? i.subagent_type ?? 'subagent'), hist: `A ${short(i.description).slice(0, 24)}` }
    case 'TodoWrite': {
      const todos: Todo[] = Array.isArray(i.todos) ? i.todos.map((t: any) => ({ t: String(t.content ?? t.subject ?? ''), s: String(t.status ?? 'pending') })) : []
      return { kind: 'plan', detail: `${todos.filter(t => t.s === 'completed').length}/${todos.length} done`, todos, hist: 'P todo list' }
    }
    case 'Bash': {
      const cmd = String(i.command ?? '')
      if (TEST_RE.test(cmd)) return { kind: 'test', path: cmd, detail: short(cmd), passed: 0, failed: 0, hist: `T ${short(cmd).slice(0, 24)}` }
      if (BROWSER_BASH_RE.test(cmd)) {
        const url = (cmd.match(/https?:\/\/[^\s"'`]+/) ?? [''])[0]
        return { kind: 'browser', path: url, detail: url || short(cmd), action: 'script', x: -1, y: -1, hist: `B ${(url || short(cmd)).slice(0, 24)}` }
      }
      return { kind: 'bash', path: cmd, detail: short(i.description ?? cmd), hist: `$ ${short(cmd).slice(0, 24)}` }
    }
    default: {
      if (tool.startsWith('mcp__') && BROWSER_TOOL_RE.test(tool + JSON.stringify(i).slice(0, 200))) {
        const blob = JSON.stringify(i)
        const url = String(i.url ?? (blob.match(/https?:\/\/[^\s"'`\\]+/) ?? [''])[0])
        const coord: unknown = i.coordinate ?? i.coordinates
        let x = typeof i.x === 'number' ? i.x : -1
        let y = typeof i.y === 'number' ? i.y : -1
        if (Array.isArray(coord) && coord.length >= 2) {
          x = Number(coord[0])
          y = Number(coord[1])
        }
        const action = String(i.action ?? tool.split('__').pop() ?? 'browse')
        return { kind: 'browser', path: url, detail: `${action} ${url}`.trim(), action, x: x < 0 ? -1 : (x % 1600) / 1600, y: y < 0 ? -1 : (y % 1000) / 1000, hist: `B ${action}`.slice(0, 28) }
      }
      if (tool.startsWith('Task') || tool === 'ToolSearch') return { kind: 'plan', detail: tool, hist: `P ${tool}` }
      return { kind: 'tool', detail: tool.replace(/^mcp__/, '').replace(/__/g, ':'), hist: `* ${tool.replace(/^mcp__/, '').slice(0, 24)}` }
    }
  }
}

export function parseTestCounts(text: string): { passed: number; failed: number } | undefined {
  const num = (re: RegExp) => {
    const m = text.match(re)
    return m ? Number(m[1]) : undefined
  }
  const passed = num(/(\d+)\s+(?:passed|passing|pass)\b/i) ?? num(/passed[:\s]+(\d+)/i)
  const failed = num(/(\d+)\s+(?:failed|failing|fail)\b/i) ?? num(/failed[:\s]+(\d+)/i)
  if (passed === undefined && failed === undefined) return undefined
  return { passed: passed ?? 0, failed: failed ?? 0 }
}

export function findPngPath(text: string): string | undefined {
  const m = text.match(/(\/[^\s"'`<>|]+\.png)\b/)
  return m ? m[1] : undefined
}

export function findPngBase64(v: unknown, depth = 0): string | undefined {
  if (depth > 5 || v === null || v === undefined) return undefined
  if (typeof v === 'string') return v.startsWith('iVBORw0KGgo') && v.length < 2_700_000 ? v : undefined
  if (Array.isArray(v)) {
    for (const x of v) {
      const r = findPngBase64(x, depth + 1)
      if (r) return r
    }
    return undefined
  }
  if (typeof v === 'object') {
    for (const x of Object.values(v as Record<string, unknown>)) {
      const r = findPngBase64(x, depth + 1)
      if (r) return r
    }
  }
  return undefined
}

// ---------------------------------------------------------------- canvas (half-block pixels + text cells)

export type Canvas = { w: number; h: number; rows: number; ch: Uint32Array; fg: Uint32Array; bg: Uint32Array }
const HALF = 0x2580

export function canvas(w: number, rows: number): Canvas {
  const n = w * rows
  return { w, h: rows * 2, rows, ch: new Uint32Array(n).fill(HALF), fg: new Uint32Array(n).fill(C.bg), bg: new Uint32Array(n).fill(C.bg) }
}

export function px(c: Canvas, x: number, y: number, col: number) {
  x = Math.round(x)
  y = Math.round(y)
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return
  const i = (y >> 1) * c.w + x
  if (c.ch[i] !== HALF) {
    c.ch[i] = HALF
    c.fg[i] = C.bg
    c.bg[i] = C.bg
  }
  if (y & 1) c.bg[i] = col
  else c.fg[i] = col
}

export function rect(c: Canvas, x: number, y: number, w: number, h: number, col: number) {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) px(c, x + xx, y + yy, col)
}

export function hline(c: Canvas, x: number, y: number, len: number, col: number) {
  for (let k = 0; k < len; k++) px(c, x + k, y, col)
}

export function line(c: Canvas, x0: number, y0: number, x1: number, y1: number, col: number) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1)
  for (let s = 0; s <= steps; s++) px(c, x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps, col)
}

export function circle(c: Canvas, cx: number, cy: number, r: number, col: number, fill = false) {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) {
      const d = Math.sqrt(x * x + y * y)
      if (fill ? d <= r : Math.abs(d - r) < 0.7) px(c, cx + x, cy + y, col)
    }
}

/** Text in cell coordinates (row, not pixel y). */
export function text(c: Canvas, x: number, row: number, s: string, fg: number, bg = C.bg) {
  if (row < 0 || row >= c.rows) return
  for (let k = 0; k < s.length; k++) {
    const xx = x + k
    if (xx < 0 || xx >= c.w) continue
    let code = s.charCodeAt(k)
    if (code < 32 || code > 126) code = 63
    const i = row * c.w + xx
    c.ch[i] = code
    c.fg[i] = fg
    c.bg[i] = bg
  }
}

export function sprite(c: Canvas, x: number, y: number, rowsArr: string[], col: number, scale = 1) {
  rowsArr.forEach((r, ry) => {
    for (let rx = 0; rx < r.length; rx++) if (r[rx] === '#') rect(c, x + rx * scale, y + ry * scale, scale, scale, col)
  })
}

export function encode(c: Canvas): string {
  const words = new Uint32Array(c.w * c.rows * 3)
  for (let i = 0; i < c.w * c.rows; i++) {
    words[i * 3] = c.ch[i]!
    words[i * 3 + 1] = c.fg[i]!
    words[i * 3 + 2] = c.bg[i]!
  }
  // toBase64 exists in the hooks runtime but not yet in every TypeScript lib.
  return (new Uint8Array(words.buffer) as Uint8Array & { toBase64(): string }).toBase64()
}

// ---------------------------------------------------------------- scenes

// ---------------------------------------------------------------- colour helpers

const rgb = (n: number): [number, number, number] => [(n >> 16) & 255, (n >> 8) & 255, n & 255]

export function mix(a: number, b: number, t: number): number {
  t = clamp(t, 0, 1)
  const [ar, ag, ab] = rgb(a)
  const [br, bg, bb] = rgb(b)
  return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t)
}

const shade = (col: number, f: number) => mix(C.bg, col, f)

function ramp(stops: number[], v: number): number {
  const x = clamp(v, 0, 0.9999) * (stops.length - 1)
  const i = Math.floor(x)
  return mix(stops[i]!, stops[i + 1]!, x - i)
}

// ---------------------------------------------------------------- thinking animations
// Each fills the whole canvas; `age` is in ticks (~125ms), `col` is the topic colour.

type Anim = (c: Canvas, age: number, col: number, words: string) => void

const plasma: Anim = (c, age, col) => {
  const W = c.w
  const H = c.h
  const cx = W / 2
  const cy = H / 2
  const stops = [C.bg, shade(C.purple, 0.4), col, mix(col, C.cyan, 0.5), mix(col, C.white, 0.75)]
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x += 2) {
      const v = (Math.sin(x / 7 + age / 9) + Math.sin(y / 5 - age / 7) + Math.sin((x + y) / 9 + age / 11) + Math.sin(Math.hypot(x - cx, y - cy) / 6 - age / 6)) / 4
      const col2 = ramp(stops, Math.pow((v + 1) / 2, 1.5))
      px(c, x, y, col2)
      px(c, x + 1, y, col2)
      px(c, x, y + 1, col2)
      px(c, x + 1, y + 1, col2)
    }
}

const neural: Anim = (c, age, col) => {
  const W = c.w
  const H = c.h
  const layers = W < 40 ? [3, 4, 3] : [3, 5, 5, 3]
  const pos = layers.map((n, l) =>
    Array.from({ length: n }, (_, i) => ({ x: 4 + (l * (W - 8)) / (layers.length - 1), y: 4 + ((i + 0.5) * (H - 8)) / n })),
  )
  const glow = new Map<string, number>()
  let e = 0
  for (let l = 0; l < pos.length - 1; l++)
    for (let i = 0; i < pos[l]!.length; i++)
      for (let j = 0; j < pos[l + 1]!.length; j++) {
        const a = pos[l]![i]!
        const b = pos[l + 1]![j]!
        line(c, a.x, a.y, b.x, b.y, shade(col, 0.16))
        const p = (age * 0.04 + (hash(e) % 100) / 100) % 1
        for (let s = 0; s < 4; s++) {
          const q = Math.max(0, p - s * 0.03)
          px(c, a.x + (b.x - a.x) * q, a.y + (b.y - a.y) * q, mix(shade(col, 0.4), C.white, (1 - s / 4) * 0.9))
        }
        if (p > 0.92) glow.set(`${l + 1}:${j}`, 1)
        e++
      }
  pos.forEach((layer, l) =>
    layer.forEach((n, i) => {
      const g = glow.get(`${l}:${i}`) ?? 0
      const base = 0.45 + 0.25 * Math.sin(age / 6 + hash(l * 9 + i) % 7)
      rect(c, n.x - 1, n.y - 1, 3, 3, mix(shade(col, base), C.white, g * 0.8))
    }),
  )
}

const orbit: Anim = (c, age, col) => {
  const W = c.w
  const H = c.h
  const cx = W / 2
  const cy = H / 2
  const pulse = 2 + (Math.sin(age / 5) + 1) * 0.8
  circle(c, cx, cy, Math.round(pulse), mix(col, C.white, 0.5), true)
  const R = Math.min(W / 2.2, H * 0.9)
  for (let k = 0; k < 3; k++) {
    const tilt = (k * Math.PI) / 3 + age / 140
    const rx = R * (1 - k * 0.12)
    const ry = rx * 0.4
    const at = (a: number): [number, number] => {
      const x = rx * Math.cos(a)
      const y = ry * Math.sin(a)
      return [cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]
    }
    for (let s = 0; s < 120; s++) {
      const [x, y] = at((s / 120) * Math.PI * 2)
      px(c, x, y, shade(col, 0.2))
    }
    for (let j = 0; j < 2; j++) {
      const head = age * 0.07 * (1 + k * 0.35) + j * Math.PI
      for (let s = 0; s < 12; s++) {
        const [x, y] = at(head - s * 0.1)
        px(c, x, y, mix(shade(col, 0.3), k === 1 ? C.cyan : C.white, 1 - s / 12))
      }
    }
  }
}

const rain: Anim = (c, age, col, words) => {
  const chars = (words.replace(/[^a-z]/gi, '') || 'think') + '01{}<>/;=+*#'
  for (let x = 0; x < c.w; x += 2) {
    const h = hash(x * 7919)
    const speed = 0.22 + (h % 50) / 110
    const trail = 4 + (h % 7)
    const head = Math.floor(age * speed + (h % 97)) % (c.rows + trail)
    for (let k = 0; k < trail; k++) {
      const row = head - k
      if (row < 0 || row >= c.rows) continue
      const ch = chars[hash(x * 31 + row * 17 + (k === 0 ? age >> 2 : 0)) % chars.length]!
      text(c, x, row, ch, k === 0 ? C.white : shade(col, (1 - k / trail) * 0.9))
    }
  }
}

const helix: Anim = (c, age, col) => {
  const W = c.w
  const H = c.h
  const A = H * 0.28
  const strand2 = C.cyan
  for (let x = 1; x < W - 1; x++) {
    const ph = x / 5 + age / 6
    const y1 = H / 2 + A * Math.sin(ph)
    const y2 = H / 2 - A * Math.sin(ph)
    if (x % 4 === 0) line(c, x, y1, x, y2, shade(mix(col, strand2, 0.5), 0.3))
  }
  for (let x = 1; x < W - 1; x++) {
    const ph = x / 5 + age / 6
    const z = Math.cos(ph)
    const y1 = H / 2 + A * Math.sin(ph)
    const y2 = H / 2 - A * Math.sin(ph)
    const a = mix(shade(col, 0.35), col, (z + 1) / 2)
    const b = mix(shade(strand2, 0.35), strand2, (1 - z) / 2)
    if (z > 0) {
      rect(c, x, y2 - 1, 1, 2, b)
      rect(c, x, y1 - 1, 1, 2, a)
    } else {
      rect(c, x, y1 - 1, 1, 2, a)
      rect(c, x, y2 - 1, 1, 2, b)
    }
  }
}

const warp: Anim = (c, age, col) => {
  const cx = c.w / 2
  const cy = c.h / 2
  const maxR = Math.hypot(c.w, c.h) / 2
  for (let i = 0; i < 80; i++) {
    const h = hash(i * 40503)
    const ang = ((h % 3600) / 3600) * Math.PI * 2
    const sp = 0.006 + ((h >> 8) % 100) / 14000
    const p = (age * sp * 8 + ((h >> 4) % 1000) / 1000) % 1
    for (let s = 0; s < 4; s++) {
      const q = Math.max(0, p - s * 0.025)
      const r = q * q * maxR
      px(c, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, mix(C.bg, mix(col, C.white, p), (1 - s / 4) * clamp(p * 1.6, 0, 1)))
    }
  }
}

const lissajous: Anim = (c, age, col) => {
  const cx = c.w / 2
  const cy = c.h / 2
  const A = c.w * 0.4
  const B = c.h * 0.4
  const phi = age / 40
  for (let s = 0; s < 160; s++) {
    const th = age * 0.09 - s * 0.045
    const x = cx + A * Math.sin(3 * th + phi)
    const y = cy + B * Math.sin(2 * th)
    const f = 1 - s / 160
    const color = mix(C.bg, mix(col, C.cyan, s / 160), f)
    px(c, x, y, color)
    if (f > 0.75) px(c, x + 1, y, color)
  }
}

export const ANIMS: Anim[] = [plasma, neural, orbit, rain, helix, warp, lissajous]

// ---------------------------------------------------------------- last-touched file badge

const OP_WORD = { R: 'read', W: 'wrote', E: 'edited' } as const
const OP_COLOR = { R: C.cyan, W: C.green, E: C.amber } as const

function fileBadge(c: Canvas, eye: Eye, t: number) {
  if (!eye.lastOp || !eye.lastFile || c.w < 16 || c.rows < 6) return
  const col = OP_COLOR[eye.lastOp]
  const recent = t - eye.lastAt < 24
  const y = (c.rows - 3) * 2
  const label = `${OP_WORD[eye.lastOp]} ${eye.lastFile}`.slice(0, c.w - 11)
  rect(c, 1, y, Math.min(c.w - 2, 10 + label.length), 6, C.bg)
  const icon = recent && (t >> 1) % 2 === 0 ? C.white : col
  rect(c, 3, y, 5, 6, icon)
  px(c, 7, y, C.bg)
  hline(c, 4, y + 2, 3, C.bg)
  hline(c, 4, y + 4, 3, C.bg)
  text(c, 10, c.rows - 2, label, col)
  text(c, 10, c.rows - 1, recent ? 'just now' : `${Math.round((t - eye.lastAt) / 8)}s ago`, C.dim)
}

function doc(c: Canvas, x: number, y: number, w: number, h: number, seed: number, colorOf: (i: number) => number | undefined) {
  rect(c, x, y, w, h, C.panel2)
  rect(c, x, y, w, 1, C.line)
  const n = Math.floor((h - 3) / 2)
  for (let i = 0; i < n; i++) {
    const ly = y + 2 + i * 2
    const indent = hash(seed * 31 + i) % 3 === 0 ? 3 : 0
    const len = 3 + (hash(seed + i * 13) % Math.max(1, w - 6 - indent))
    const hot = colorOf(i)
    if (hot !== undefined) rect(c, x + 1, ly - (ly > y ? 0 : 0), w - 2, 1, hot === C.dim ? C.panel2 : (hot & 0xfefefe) >> 2)
    hline(c, x + 2 + indent, ly, len, hot ?? C.dim)
  }
  return n
}

function fileLog(c: Canvas, x: number, eye: Eye, fromRow: number) {
  const room = c.w - x - 1
  if (room < 8) return
  const files = eye.history.filter(h => 'RWE'.includes(h[0]!)).slice(-(c.rows - fromRow - 1))
  files.forEach((h, k) => {
    const col = h[0] === 'R' ? C.cyan : h[0] === 'W' ? C.green : C.amber
    const last = k === files.length - 1
    text(c, x, fromRow + k, h.slice(0, room), last ? col : C.dim)
  })
}

export function scene(c: Canvas, eye: Eye, t: number) {
  const age = Math.max(0, t - eye.since)
  const W = c.w
  const H = c.h
  const meta = KIND[eye.kind]
  const seedP = hash(eye.path || eye.detail)
  // faint star field
  for (let y = 1; y < H; y += 5) for (let x = (y * 3) % 7; x < W; x += 7) px(c, x, y, C.line)

  switch (eye.kind) {
    case 'read': {
      const dw = clamp(Math.floor(W * 0.42), 12, 30)
      const dh = H - 4
      const nLines = Math.floor((dh - 3) / 2)
      const hot = nLines > 0 ? Math.floor(age / 2) % nLines : 0
      doc(c, 2, 2, dw, dh, seedP, i => (i === hot ? C.cyan : i === hot - 1 || i === hot + 1 ? C.blue : undefined))
            fileLog(c, dw + 5, eye, 1)
      break
    }
    case 'write': {
      const dw = clamp(Math.floor(W * 0.42), 12, 30)
      const dh = H - 4
      const nLines = Math.floor((dh - 3) / 2)
      const fill = eye.result ? nLines : Math.min(nLines, Math.floor(age / 2))
      doc(c, 2, 2, dw, dh, seedP, i => (i < fill ? C.green : undefined))
      if (!eye.result && fill < nLines && age % 6 < 3) rect(c, 4 + (hash(seedP + fill) % 10), 4 + fill * 2, 2, 1, C.amber)
      if (eye.result) circle(c, 2 + dw - 3, 5, 2, C.green)
      fileLog(c, dw + 5, eye, 1)
      break
    }
    case 'edit': {
      const dw = clamp(Math.floor(W * 0.42), 12, 30)
      const dh = H - 4
      const nLines = Math.floor((dh - 3) / 2)
      const target = nLines > 0 ? seedP % nLines : 0
      const showNew = eye.result === 'ok' || age % 40 >= 20
      doc(c, 2, 2, dw, dh, seedP, i => (i === target ? (showNew ? C.green : C.red) : undefined))
      if (!showNew) hline(c, 3, 2 + 2 + target * 2, dw - 4, C.red)
      fileLog(c, dw + 5, eye, 1)
      break
    }
    case 'search': {
      const tw = 5
      const th = 3
      const cx = W / 2 + Math.sin(age / 9) * W * 0.32
      const cy = H / 2 + Math.sin(age / 5 + 1) * H * 0.26
      for (let ty = 2; ty < H - 3; ty += th + 1)
        for (let tx = 2; tx < W - 3; tx += tw + 1) {
          const d = Math.hypot(tx + tw / 2 - cx, ty + th / 2 - cy)
          const lit = d < 9
          rect(c, tx, ty, tw, th, lit ? (hash(tx * 7 + ty) % 4 === 0 ? C.amber : C.purple) : C.panel2)
        }
      circle(c, Math.round(cx), Math.round(cy), 6, C.white)
      line(c, Math.round(cx) + 4, Math.round(cy) + 4, Math.round(cx) + 9, Math.round(cy) + 9, C.white)
      text(c, 1, c.rows - 1, ('/' + eye.path).slice(0, W - 2), C.purple)
      break
    }
    case 'bash': {
      rect(c, 1, 1, W - 2, H - 2, 0x0b0e14)
      rect(c, 1, 1, W - 2, 2, C.panel2)
      px(c, 3, 1, C.red); px(c, 5, 1, C.amber); px(c, 7, 1, C.green)
      text(c, 2, 1, ('$ ' + eye.path.split('\n')[0]!).slice(0, W - 14), C.green, 0x0b0e14)
      const bars = c.rows - 4
      for (let r = 0; r < bars; r++) {
        const k = eye.result ? r : r + Math.floor(age / 3)
        const len = 3 + (hash(eye.path + k) % Math.max(1, W - 12))
        const col = hash(eye.path + k * 3) % 11 === 0 ? C.amber : eye.result === 'fail' && r === bars - 1 ? C.red : C.dim
        hline(c, 3, 6 + r * 2, len, col)
      }
      const status = eye.result === 'ok' ? 'exit ok' : eye.result === 'fail' ? 'exit error' : age % 8 < 4 ? 'running_' : 'running '
      text(c, 2, c.rows - 1, status, eye.result === 'fail' ? C.red : eye.result === 'ok' ? C.green : C.amber, 0x0b0e14)
      break
    }
    case 'test': {
      text(c, 1, 0, 'TESTS', C.pink)
      const known = eye.passed + eye.failed
      const perRow = Math.max(4, Math.floor((W - 4) / 3))
      const rowsAvail = Math.max(1, Math.floor((H - 12) / 3))
      const cap = perRow * rowsAvail
      const total = Math.min(cap, known > 0 ? known : 60)
      const filled = eye.result ? total : Math.min(total, Math.floor(age * 1.2))
      const failedDots = eye.result && known > 0 ? Math.round((eye.failed / known) * total) : eye.result === 'fail' && known === 0 ? 2 : 0
      const failSet = new Set<number>()
      for (let k = 0; k < failedDots; k++) failSet.add(hash(eye.path + k) % total)
      for (let k = 0; k < total; k++) {
        const x = 2 + (k % perRow) * 3
        const y = 5 + Math.floor(k / perRow) * 3
        const col = k >= filled ? C.panel2 : failSet.has(k) ? C.red : k >= filled - 2 && !eye.result ? C.cyan : C.green
        rect(c, x, y, 2, 2, col)
      }
      const summary = known > 0 ? `${eye.passed} passed  ${eye.failed} failed` : eye.result ? (eye.result === 'ok' ? 'passed' : 'failed') : 'running...'
      text(c, 1, c.rows - 2, summary, eye.failed > 0 || eye.result === 'fail' ? C.red : C.green)
      text(c, 1, c.rows - 1, eye.path.slice(0, W - 2), C.dim)
      break
    }
    case 'browser': {
      rect(c, 1, 0, W - 2, H, C.panel)
      rect(c, 1, 0, W - 2, 2, C.panel2)
      px(c, 3, 0, C.red); px(c, 5, 0, C.amber); px(c, 7, 0, C.green)
      rect(c, 10, 2, W - 14, 2, C.bg)
      text(c, 11, 1, (eye.path || 'about:blank').replace(/^https?:\/\//, '').slice(0, W - 17), C.ink, C.bg)
      const loading = !eye.result && age < 30
      if (loading) hline(c, 10, 4, Math.floor(((W - 14) * age) / 30), C.blue)
      const py = 5
      const pw = W - 4
      const ph = H - py - 1
      const hue = (n: number) => [C.blue, C.purple, C.cyan, C.green, C.amber, C.pink][n % 6]!
      const s = seedP
      rect(c, 2, py, pw, 3, C.panel2)
      rect(c, 4, py + 1, 6, 1, hue(s))
      if (!loading || age > 10) {
        rect(c, 3, py + 5, Math.floor(pw * 0.7), Math.max(3, Math.floor(ph * 0.3)), (hue(s >> 3) & 0xfcfcfc) >> 2)
        const cols = 2 + (s % 3)
        const cw = Math.floor((pw - 2 - cols) / cols)
        const cy = py + 7 + Math.floor(ph * 0.3)
        for (let k = 0; k < cols; k++) {
          rect(c, 3 + k * (cw + 1), cy, cw, Math.max(2, py + ph - cy - 1), C.panel2)
          hline(c, 4 + k * (cw + 1), cy + 1, Math.max(1, cw - 3), hue(s + k))
          hline(c, 4 + k * (cw + 1), cy + 3, Math.max(1, cw - 5), C.dim)
        }
      }
      const fx = eye.x >= 0 ? eye.x : 0.5 + 0.35 * Math.sin(age / 12)
      const fy = eye.y >= 0 ? eye.y : 0.5 + 0.3 * Math.sin(age / 7 + 2)
      const mx = Math.round(2 + fx * (pw - 3))
      const my = Math.round(py + fy * (ph - 3))
      if (/click|press|tap/i.test(eye.action)) circle(c, mx, my, 1 + (age % 8), C.amber)
      if (/type|fill|key/i.test(eye.action)) rect(c, mx, my, 1, 3, age % 6 < 3 ? C.white : C.panel2)
      sprite(c, mx, my, ['#..', '##.', '###', '##.', '#..'], C.white)
      text(c, 1, c.rows - 1, eye.action.slice(0, W - 2), C.blue, C.panel)
      break
    }
    case 'web': {
      const r = clamp(Math.min(Math.floor(H / 2) - 3, Math.floor(W / 4)), 4, 20)
      const cx = Math.floor(W / 2)
      const cy = Math.floor(H / 2) - 1
      for (let lat = -75; lat <= 75; lat += 25)
        for (let lon = 0; lon < 360; lon += 20) {
          const la = (lat * Math.PI) / 180
          const lo = ((lon + age * 4) * Math.PI) / 180
          const z = Math.cos(la) * Math.cos(lo)
          if (z > 0) px(c, cx + r * Math.cos(la) * Math.sin(lo), cy - r * Math.sin(la), z > 0.6 ? C.cyan : C.blue)
        }
      const a = age / 6
      px(c, cx + (r + 4) * Math.cos(a), cy + (r + 4) * Math.sin(a) * 0.35, C.amber)
      text(c, 1, c.rows - 1, eye.detail.slice(0, W - 2), C.blue)
      break
    }
    case 'agent': {
      const rx = Math.floor(W / 2)
      const pulse = age % 12 < 6 ? 3 : 2
      circle(c, rx, 5, pulse, C.purple, true)
      const kids = 3
      for (let k = 0; k < kids; k++) {
        const kx = Math.floor((W * (k + 1)) / (kids + 1))
        const ky = Math.floor(H * 0.68)
        line(c, rx, 8, kx, ky - 3, C.dim)
        const p = ((age + k * 5) % 20) / 20
        px(c, rx + (kx - rx) * p, 8 + (ky - 11) * p, C.amber)
        circle(c, kx, ky, 2 + ((age + k * 4) % 12 < 6 ? 1 : 0), C.purple, true)
      }
      text(c, 1, c.rows - 1, eye.detail.slice(0, W - 2), C.purple)
      break
    }
    case 'plan': {
      text(c, 1, 0, 'PLAN', C.amber)
      const room = c.rows - 2
      if (eye.todos.length === 0) text(c, 1, 2, eye.detail.slice(0, W - 2), C.ink)
      eye.todos.slice(0, room).forEach((td, k) => {
        const done = td.s === 'completed'
        const doing = td.s === 'in_progress'
        const mark = done ? '[x] ' : doing ? (age % 8 < 4 ? '[>] ' : '[ ] ') : '[ ] '
        text(c, 1, 2 + k, (mark + td.t).slice(0, W - 2), done ? C.green : doing ? C.amber : C.dim)
      })
      break
    }
    case 'think': {
      const top = eye.topics[0]
      const m = top ? topicMeta(top) : IDEA
      const idx = (hash(eye.id + ':' + eye.since) + Math.floor(age / 200)) % ANIMS.length
      ANIMS[idx]!(c, age, m.color, eye.topics.join(''))
      if (W >= 26) {
        rect(c, 1, 1, 10, 10, C.bg)
        sprite(c, 2, 2, m.sprite, m.color, 1)
        let x = 12
        const dots = '.'.repeat(1 + ((age >> 2) % 3))
        if (eye.topics.length === 0) text(c, x, 1, ('thinking' + dots).slice(0, W - x - 1), C.amber)
        eye.topics.forEach(name => {
          const label = '#' + name
          if (x + label.length < W) text(c, x, 1, label, topicMeta(name).color)
          x += label.length + 1
        })
      }
      fileBadge(c, eye, t)
      break
    }
    case 'tool': {
      const cx = Math.floor(W / 2)
      const cy = Math.floor(H / 2) - 2
      const a = age / 5
      for (let k = 0; k < 4; k++) line(c, cx, cy, cx + Math.cos(a + (k * Math.PI) / 2) * 6, cy + Math.sin(a + (k * Math.PI) / 2) * 6, C.ink)
      circle(c, cx, cy, 2, C.paper, true)
      text(c, 1, c.rows - 1, eye.detail.slice(0, W - 2), C.ink)
      break
    }
    default: {
      const mid = Math.floor(c.rows / 2)
      const dots = '.'.repeat(1 + ((t >> 2) % 3))
      text(c, Math.max(1, Math.floor((W - 20) / 2)), mid, ('waiting for the agent' + dots).slice(0, W - 2), C.ink)
      fileBadge(c, eye, t)
      break
    }
  }
}
