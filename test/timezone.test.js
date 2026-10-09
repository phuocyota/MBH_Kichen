import test from 'node:test'
import assert from 'node:assert/strict'
import process from 'node:process'
import { localInput, toInstant } from '../src/page/portal/portalHelpers.js'

test('production wall clocks stay in Bangkok across device timezones', () => {
  const previous = process.env.TZ
  try {
    for (const timezone of ['UTC', 'America/New_York', 'Asia/Bangkok']) {
      process.env.TZ = timezone
      assert.equal(toInstant('2026-10-08T12:30'), '2026-10-08T05:30:00.000Z')
      assert.equal(localInput('2026-10-08T05:30:00Z'), '2026-10-08T12:30')
      assert.equal(localInput('2026-10-07T18:00:00Z'), '2026-10-08T01:00')
      assert.equal(
        toInstant('2026-10-08T12:30:00+07:00'),
        '2026-10-08T05:30:00.000Z',
      )
    }
  } finally {
    if (previous === undefined) delete process.env.TZ
    else process.env.TZ = previous
  }
})
