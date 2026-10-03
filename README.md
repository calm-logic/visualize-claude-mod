# visualize

A Claude Code mod that shows *what the agent is looking at and thinking about* as pixel art.

- **File access**: a document with a scan-beam for reads, lines filling in for writes, red/green flips for edits, plus a log of recent files.
- **Test runs**: a dot grid that fills green and turns red on failures (counts parsed from the output).
- **Browser flows**: a pixelated browser window with a cursor and click ripples; a real screenshot feed when the tool returns a PNG (kitty / Ghostty).
- **Thinking**: sprites and `#topic` chips chosen by keyword (debug, test, refactor, design, security, git, ...).
- **Subagents**: one eye each, and a full-screen grid of every agent at once.

## Use

```
/visualize   open the grid of main + all subagents (Esc closes)
```

## Install

```
claude plugin marketplace add calm-logic/visualize-claude-mod
claude plugin install visualize@visualize-claude-mod
```

Or try it for one session without installing: `claude --plugin-dir ./`.

## Develop

```
claude plugin validate .
claude plugin test .
npx -p typescript tsc -p .claude-plugin/types/tsconfig.json --noEmit
```
