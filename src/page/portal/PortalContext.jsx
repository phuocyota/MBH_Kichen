import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Outlet } from 'react-router-dom'
import { allPages } from '../../api/kitchenApi'
import { useAuth } from '../../auth/authContext'
import { CatalogContext } from './portalHelpers'
import { createCatalogStore } from '../../api/catalogStore'
export function PortalContext() {
  const { session, branchId, selectBranch } = useAuth()
  const [branches, setBranches] = useState([]),
    [branchError, setBranchError] = useState(''),
    [revision, setRevision] = useState(0)
  const store = useMemo(() => {
    const token = session.accessToken
    return createCatalogStore((resource, signal) => {
      if (!token) return Promise.resolve([])
      return allPages(resource, { branchId }, signal)
    })
  }, [branchId, session.accessToken])
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const error =
    branchError ||
    Object.values(snapshot.entries).find((entry) => entry.error)?.error
  useEffect(() => {
    if (session.userType !== 'ADMIN' || session.branchId) return
    const abort = new AbortController()
    allPages('/branches', {}, abort.signal)
      .then((rows) => {
        if (!abort.signal.aborted) {
          setBranches(rows)
          setBranchError('')
        }
      })
      .catch((e) => {
        if (!abort.signal.aborted) setBranchError(e.message)
      })
    return () => abort.abort()
  }, [session.userType, session.branchId, revision])
  useEffect(() => () => store.abort(), [store])
  return (
    <CatalogContext.Provider value={store}>
      {!session.branchId && session.userType === 'ADMIN' && (
        <label className="mb-5 flex items-center gap-3 rounded-xl bg-white p-4 font-semibold">
          Chi nhánh{' '}
          <select
            className="rounded-lg border p-2"
            value={branchId}
            onChange={(e) => selectBranch(e.target.value)}
          >
            <option value="">Chọn chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-red-700"
        >
          {error}{' '}
          <button
            onClick={() => {
              store.invalidate()
              setRevision((r) => r + 1)
            }}
            className="underline"
          >
            Thử lại
          </button>
        </div>
      )}
      {!branchId ? <p>Chọn chi nhánh để làm việc.</p> : <Outlet />}
    </CatalogContext.Provider>
  )
}
