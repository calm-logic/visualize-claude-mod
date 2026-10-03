import { expect, test } from 'claude-code/testing'

for (const requestId of ['visualize']) {
  test(`${requestId} pane draws a valid tree`, async ($, on) => {
    const mounted = await $.ui.mount({
      plugin: 'visualize',
      surface: 'terminal',
      component: 'Pane',
      requestId,
      props: { bodyColumns: 60 } as never,
      viewport: { columns: 100, rows: 30, isFullscreen: false } as never,
    })
    expect(mounted).toBeDefined()
  })
}
