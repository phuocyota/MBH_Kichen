import test from 'node:test'
import assert from 'node:assert/strict'
import { routeDate, routeMeal, withDate } from '../src/page/portal/routeFilters.js'

test('overview boarding notification opens its selected day and meal', () => {
  const path = withDate('/dashboard/kitchen-plan/boarding', '2026-10-26', { mealPeriod: 'BREAKFAST' })
  const search = new URL(path, 'http://localhost').searchParams
  assert.equal(routeDate(search, '2026-10-27'), '2026-10-26')
  assert.equal(routeMeal(search), 'BREAKFAST')
  search.set('mealPeriod', 'DINNER')
  assert.equal(routeMeal(search), 'DINNER')
  search.delete('mealPeriod')
  assert.equal(routeMeal(search), '')
})

test('task navigation preserves the chosen date, status, task identity and hash', () => {
  const path = withDate('/dashboard/kitchen/tasks?status=COMPLETED,HANDED_OVER&type=batch&id=task-1#details', '2026-10-24')
  const url = new URL(path, 'http://localhost')
  assert.equal(routeDate(url.searchParams, '2026-10-26'), '2026-10-24')
  assert.equal(url.searchParams.get('status'), 'COMPLETED,HANDED_OVER')
  assert.equal(url.searchParams.get('id'), 'task-1')
  assert.equal(url.hash, '#details')
})

test('invalid dates and unsupported meals do not become active filters', () => {
  for (const date of ['2026-02-30', '2026-13-01', '26/10/2026', '2026-1-2', '2026-10-26T00:00:00Z', '']) {
    assert.equal(routeDate(new URLSearchParams({ date }), '2026-10-26'), '2026-10-26')
  }
  assert.equal(routeDate(new URLSearchParams('date=2028-02-29'), '2026-10-26'), '2028-02-29')
  assert.equal(routeMeal(new URLSearchParams('mealPeriod=Ca+sáng')), '')
})

test('overview links replace stale dates and can clear a selected meal', () => {
  const path = withDate('/dashboard/kitchen-plan/boarding?date=2026-01-01&mealPeriod=LUNCH', '2026-10-26', { mealPeriod: '' })
  const search = new URL(path, 'http://localhost').searchParams
  assert.equal(search.getAll('date').length, 1)
  assert.equal(search.get('date'), '2026-10-26')
  assert.equal(search.has('mealPeriod'), false)
})
