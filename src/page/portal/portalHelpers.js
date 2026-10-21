import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from 'react'
export const CatalogContext = createContext(null)
export function useCatalog(keys = ['products']) {
  const store = useContext(CatalogContext)
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const key = [...new Set(keys)].sort().join(',')
  useEffect(() => {
    if (key) store.load(key.split(','))
  }, [store, key, snapshot.version])
  const products = snapshot.entries.products?.data || []
  return {
    products,
    loading: keys.some((key) => !snapshot.entries[key] || snapshot.entries[key].loading),
    error: keys.map((key) => snapshot.entries[key]?.error).find(Boolean) || '',
    units: snapshot.entries.units?.data || [],
    stations: snapshot.entries.stations?.data || [],
    categories: snapshot.entries.categories?.data || [],
    productName: (id) => products.find((p) => p.id === id)?.name || id,
    refreshCatalog: store.invalidate,
  }
}
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
export const toInstant = (value) =>
  value
    ? new Date(
        /(Z|[+-]\d\d:\d\d)$/.test(value) ? value : `${value}+07:00`,
      ).toISOString()
    : undefined
export const defaultQuery = () => ({ date: today(), page: 1, size: 20 })
export function localInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return value
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}
export const summaryLabels = {
  ticketCounts: 'Đơn căn tin',
  batchCounts: 'Mẻ chế biến',
  expiredQuantity: 'Tồn hết hạn',
  importCount: 'Phiếu nhập',
  importedQuantity: 'Tổng nhập',
  exportedQuantity: 'Tổng xuất',
  recalledQuantity: 'Thu hồi',
  remainingQuantity: 'Tồn tại bếp (gồm hết hạn)',
  quarantinedQuantity: 'Tồn cách ly',
  canceledQuantity: 'Số lượng hủy',
  cancelCount: 'Phiếu hủy',
  sampleCount: 'Mẫu lưu',
  pendingSampleCount: 'Mẫu chưa xử lý',
}
