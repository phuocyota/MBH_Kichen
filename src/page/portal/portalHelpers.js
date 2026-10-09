import { createContext, useContext } from 'react'
export const CatalogContext = createContext(null)
export const useCatalog = () => useContext(CatalogContext)
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
