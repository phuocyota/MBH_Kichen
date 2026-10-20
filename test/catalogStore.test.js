import test from 'node:test'
import assert from 'node:assert/strict'
import { createCatalogStore } from '../src/api/catalogStore.js'

test('read-only pages request no catalog; consumers share completed and pending requests', async () => {
  const calls = []
  let resolve
  const store = createCatalogStore((resource) => {
    calls.push(resource)
    return new Promise((done) => {
      resolve = done
    })
  })
  await store.load([])
  assert.deepEqual(calls, [])
  const pending = store.load(['products'])
  await store.load(['products'])
  assert.deepEqual(calls, ['/products'])
  resolve([{ id: 'p', name: 'Gạo' }])
  await pending
  await store.load(['products'])
  assert.deepEqual(calls, ['/products'])
  assert.equal(store.getSnapshot().entries.products.data[0].name, 'Gạo')
})

test('loads only requested catalogs, retaining data when switching screens', async () => {
  const calls = []
  const store = createCatalogStore(async (resource) => {
    calls.push(resource)
    return []
  })
  await store.load(['products', 'stations'])
  await store.load(['products'])
  await store.load(['units'])
  assert.deepEqual(calls, ['/products', '/kitchen/stations', '/kitchen/units'])
  assert.equal(store.getSnapshot().entries.categories, undefined)
})

test('branch stores cannot reuse another branch data', async () => {
  const first = createCatalogStore(async () => [{ id: 'branch-a-product' }])
  const second = createCatalogStore(async () => [{ id: 'branch-b-product' }])
  await Promise.all([first.load(['products']), second.load(['products'])])
  assert.equal(
    first.getSnapshot().entries.products.data[0].id,
    'branch-a-product',
  )
  assert.equal(
    second.getSnapshot().entries.products.data[0].id,
    'branch-b-product',
  )
})

test('invalidating an in-flight request discards stale results and only reloads requested catalogs', async () => {
  const requests = []
  const store = createCatalogStore(
    (resource, signal) =>
      new Promise((resolve) => requests.push({ resource, signal, resolve })),
  )
  const old = store.load(['products', 'units'])
  store.invalidate()
  const fresh = store.load(['products'])
  assert.equal(requests[0].signal.aborted, true)
  requests[2].resolve([{ id: 'fresh' }])
  await fresh
  requests[0].resolve([{ id: 'stale' }])
  requests[1].resolve([])
  await old
  assert.equal(store.getSnapshot().entries.products.data[0].id, 'fresh')
  assert.equal(store.getSnapshot().entries.units, undefined)
})

test('aborted mounts can reload and errors remain retryable', async () => {
  let count = 0
  const store = createCatalogStore(async () => {
    count++
    if (count === 2) throw new Error('Không kết nối được')
    return [{ id: 'p' }]
  })
  const pending = store.load(['products'])
  store.abort()
  await pending
  assert.equal(store.getSnapshot().entries.products, undefined)
  await store.load(['products'])
  assert.equal(store.getSnapshot().entries.products.error, 'Không kết nối được')
  store.invalidate()
  await store.load(['products'])
  assert.equal(store.getSnapshot().entries.products.data[0].id, 'p')
})
