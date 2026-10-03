export type EyeKind =
  | 'idle'
  | 'think'
  | 'read'
  | 'write'
  | 'edit'
  | 'search'
  | 'bash'
  | 'test'
  | 'browser'
  | 'web'
  | 'agent'
  | 'plan'
  | 'tool'

export type Todo = { t: string; s: string }

export type Eye = {
  id: string
  label: string
  kind: EyeKind
  detail: string
  path: string
  since: number
  topics: string[]
  history: string[]
  result: '' | 'ok' | 'fail'
  passed: number
  failed: number
  x: number
  y: number
  progress: number
  done: boolean
  hasShot: boolean
  todos: Todo[]
  action: string
  /** Last file read/written/edited: survives scene changes. */
  lastOp: '' | 'R' | 'W' | 'E'
  lastFile: string
  lastAt: number
}

declare module 'claude-code' {
  interface PluginState {
    'visualize': {
      eyes: Record<string, Eye>
      tick: number
    }
  }
}
