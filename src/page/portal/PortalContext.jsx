import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { allPages } from '../../api/kitchenApi'
import { useAuth } from '../../auth/authContext'
import { useKitchenSocket } from '../../hooks/useKitchenData'
import { CatalogContext } from './portalHelpers'
export function PortalContext() {
  const { session, branchId, selectBranch } = useAuth()
  const [branches, setBranches] = useState([]),
    [result, setResult] = useState({}),
    [branchError, setBranchError] = useState(''),
    [revision, setRevision] = useState(0)
  const scope = branchId
  const catalog =
    result.scope === scope
      ? result.catalog || {
          products: [],
          units: [],
          stations: [],
          categories: [],
        }
      : { products: [], units: [], stations: [], categories: [] }
  const error = branchError || (result.scope === scope ? result.error : '')
  const loading = branchId && result.scope !== scope
  useKitchenSocket()
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
  useEffect(() => {
    const refresh = () => setRevision((r) => r + 1)
    window.addEventListener('kitchen:reload', refresh)
    return () => window.removeEventListener('kitchen:reload', refresh)
  }, [])
  useEffect(() => {
    if (!branchId) return
    const abort = new AbortController()
    Promise.all([
      allPages('/products', { branchId }, abort.signal),
      allPages('/kitchen/units', { branchId }, abort.signal),
      allPages('/kitchen/stations', { branchId }, abort.signal),
      allPages('/products/categories', { branchId }, abort.signal),
    ])
      .then(([products, units, stations, categories]) => {
        if (!abort.signal.aborted) {
          setResult({
            scope,
            catalog: { products, units, stations, categories },
            error: '',
          })
        }
      })
      .catch((e) => {
        if (!abort.signal.aborted)
          setResult((r) => ({
            scope,
            catalog: r.scope === scope ? r.catalog : undefined,
            error: e.message,
          }))
      })
    return () => abort.abort()
  }, [branchId, revision, scope])
  const value = {
    ...catalog,
    productName: (id) => catalog.products.find((p) => p.id === id)?.name || id,
    refreshCatalog: () => setRevision((r) => r + 1),
  }
  return (
    <CatalogContext.Provider value={value}>
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
            onClick={() => setRevision((r) => r + 1)}
            className="underline"
          >
            Thử lại
          </button>
        </div>
      )}
      {!branchId ? (
        <p>Chọn chi nhánh để làm việc.</p>
      ) : loading ? (
        <p role="status">Đang tải danh mục…</p>
      ) : error && !result.catalog ? null : (
        <Outlet />
      )}
    </CatalogContext.Provider>
  )
}
