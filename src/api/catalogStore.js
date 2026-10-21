export const catalogResources = {
  products: '/products',
  units: '/kitchen/units',
  stations: '/kitchen/stations',
  categories: '/products/categories',
}

// One store per authenticated branch. Only mounted consumers request data.
export function createCatalogStore(fetchRows) {
  let snapshot = { version: 0, entries: {} }
  const listeners = new Set()
  const pending = new Map()
  const publish = (entries, version = snapshot.version) => {
    snapshot = { entries, version }
    listeners.forEach((listener) => listener())
  }
  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    load(keys) {
      return Promise.all(
        keys.map(async (key) => {
          if (!catalogResources[key] || snapshot.entries[key]) return
          const controller = new AbortController()
          pending.set(key, controller)
          publish({ ...snapshot.entries, [key]: { loading: true, data: [] } })
          try {
            const data = await fetchRows(
              catalogResources[key],
              controller.signal,
            )
            if (!controller.signal.aborted)
              publish({ ...snapshot.entries, [key]: { data, loading: false } })
          } catch (error) {
            if (!controller.signal.aborted)
              publish({
                ...snapshot.entries,
                [key]: { data: [], loading: false, error: error.message },
              })
          } finally {
            if (pending.get(key) === controller) pending.delete(key)
          }
        }),
      )
    },
    invalidate() {
      pending.forEach((controller) => controller.abort())
      pending.clear()
      publish({}, snapshot.version + 1)
    },
    abort() {
      const entries = { ...snapshot.entries }
      pending.forEach((controller, key) => {
        controller.abort()
        delete entries[key]
      })
      pending.clear()
      publish(entries)
    },
  }
}
