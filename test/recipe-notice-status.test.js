import test from 'node:test'
import assert from 'node:assert/strict'
import { pendingRecipeRequests } from '../src/page/portal/recipeRequestStatus.js'

test('chef badge and inbox include pending approval but exclude resolved production blockers', () => {
  const data = ['OPEN', 'DRAFTED', 'REVISION_REQUESTED', 'SUBMITTED', 'APPROVED', 'RESOLVED'].map((status) => ({ status }))
  assert.deepEqual(pendingRecipeRequests(data).map((row) => row.status), ['OPEN', 'DRAFTED', 'REVISION_REQUESTED', 'SUBMITTED'])
  assert.deepEqual(pendingRecipeRequests(null), [])
})
