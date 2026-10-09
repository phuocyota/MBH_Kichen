import { defaultQuery } from './portalHelpers'
import { useState } from 'react'
import { useAuth } from '../../auth/authContext'
import { useCatalog, toInstant } from './portalHelpers'
import { useKitchenData } from '../../hooks/useKitchenData'
import { api } from '../../api/kitchenApi'
import {
  ActionButton,
  Dialog,
  Field,
  Filters,
  ImageField,
  PageFrame,
  Pagination,
  Table,
  buttonClass,
} from './PortalUI'
import { localInput, summaryLabels } from './portalHelpers'

export function CookingPage({ tickets = false }) {
  const { branchId } = useAuth(),
    catalog = useCatalog(),
    [query, setQuery] = useState(defaultQuery),
    [dialog, setDialog] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const resource = tickets ? '/kitchen/tickets' : '/kitchen/meal-plans'
  const params = tickets
    ? {
        page: query.page,
        size: query.size,
        from: `${query.date}T00:00:00+07:00`,
        to: `${query.date}T23:59:59.999+07:00`,
      }
    : { date: query.date }
  const state = useKitchenData(resource, params)
  const rows = tickets
    ? state.data?.data || []
    : (state.data || [])
        .flatMap((p) =>
          (p.batches || []).map((b) => ({ ...b, date: p.planDate })),
        )
        .filter((b) => !query.shift || b.shift === query.shift)
  async function start(row) {
    if (busy) return
    setBusy(true)
    try {
      await api.action(
        tickets ? '/kitchen/tickets' : '/kitchen/batches',
        row.id,
        'start',
        { expectedVersion: row.version, branchId },
      )
      setError('')
      await state.reload()
    } catch (e) {
      setError(e.message)
      await state.reload()
    } finally {
      setBusy(false)
    }
  }
  return (
    <PageFrame
      title={tickets ? 'Đơn căn tin' : 'Theo dõi chế biến'}
      description="Chờ làm → Đang chế biến → Sẵn sàng → Hoàn tất. Chọn lô và lấy mẫu ở các màn tương ứng."
      state={state}
    >
      <Filters query={query} setQuery={setQuery} />
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      <Table
        rows={rows}
        columns={
          tickets
            ? [
                ['order', 'Đơn', (r) => r.order?.code || r.orderId],
                [
                  'items',
                  'Món',
                  (r) =>
                    r.items
                      ?.map((i) => `${i.productName} × ${i.quantity}`)
                      .join(', '),
                ],
                ['status', 'Trạng thái'],
                ['version', 'Phiên bản'],
              ]
            : [
                ['product', 'Món', (r) => catalog.productName(r.productId)],
                ['source', 'Nguồn'],
                ['shift', 'Ca'],
                ['plannedQuantity', 'Kế hoạch'],
                ['adjustmentQuantity', 'Điều chỉnh'],
                ['actualQuantity', 'Thực tế'],
                ['status', 'Trạng thái'],
              ]
        }
        actions={(r) => (
          <>
            {r.status === 'WAITING' && (
              <ActionButton disabled={busy} onClick={() => start(r)}>
                Bắt đầu
              </ActionButton>
            )}
            {r.status === 'PREPARING' && (
              <ActionButton
                disabled={busy}
                onClick={() => setDialog({ row: r, action: 'ready' })}
              >
                Món sẵn sàng
              </ActionButton>
            )}
            {!tickets && r.status === 'READY' && (
              <ActionButton
                disabled={busy}
                onClick={() => setDialog({ row: r, action: 'complete' })}
              >
                Hoàn tất
              </ActionButton>
            )}
            {!tickets && (
              <ActionButton
                disabled={busy}
                onClick={() => setDialog({ row: r, action: 'edit' })}
              >
                Chi tiết / sản lượng
              </ActionButton>
            )}
          </>
        )}
      />
      {tickets && (
        <Pagination data={state.data} query={query} setQuery={setQuery} />
      )}
      {dialog && (
        <Dialog
          title="Cập nhật chế biến"
          onClose={() => setDialog(null)}
          initial={{
            actualQuantity: dialog.row.actualQuantity ?? '',
            ...dialog.row.details,
          }}
          onSubmit={async (v) => {
            const dto = { ...v, branchId, expectedVersion: dialog.row.version }
            if (dto.actualQuantity === '') delete dto.actualQuantity
            if (dto.estimatedDoneAt)
              dto.estimatedDoneAt = toInstant(dto.estimatedDoneAt)
            if (dialog.action === 'edit')
              await api.update('/kitchen/batches', dialog.row.id, dto)
            else
              await api.action(
                tickets ? '/kitchen/tickets' : '/kitchen/batches',
                dialog.row.id,
                dialog.action,
                dto,
              )
            await state.reload()
          }}
        >
          {(v, change) => (
            <>
              {!tickets && (
                <>
                  <Field
                    label="Sản lượng thực tế (sau lấy mẫu)"
                    type="number"
                    min="0"
                    step="0.0001"
                    required={dialog.action === 'complete'}
                    value={v.actualQuantity}
                    onChange={(x) => change('actualQuantity', x)}
                  />
                  <Field
                    label="Dự kiến xong"
                    required={false}
                    type="datetime-local"
                    value={localInput(v.estimatedDoneAt)}
                    onChange={(x) => change('estimatedDoneAt', x)}
                  />
                  <Field
                    label="Sự cố"
                    required={false}
                    value={v.issueNote}
                    onChange={(x) => change('issueNote', x)}
                  />
                  <ImageField
                    value={v.imageUrl}
                    onChange={(x) => change('imageUrl', x)}
                  />
                </>
              )}
              <Field
                label="Ghi chú"
                required={false}
                value={v.note}
                onChange={(x) => change('note', x)}
              />
            </>
          )}
        </Dialog>
      )}
    </PageFrame>
  )
}
export function BoardingPage() {
  const { branchId, manager } = useAuth(),
    { productName } = useCatalog(),
    [query, setQuery] = useState(defaultQuery),
    [dialog, setDialog] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const state = useKitchenData('/kitchen/meal-plans', { date: query.date })
  async function lock(r) {
    setBusy(true)
    try {
      await api.action('/kitchen/meal-plans', r.id, 'lock')
      await state.reload()
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <PageFrame
      title="Kế hoạch bán trú"
      description="Khóa kế hoạch để sinh mẻ chế biến từ thực đơn bán trú và số suất đăng ký. Kế hoạch thủ công được lập riêng."
      state={state}
      action={
        manager && (
          <button
            className={buttonClass}
            onClick={() => setDialog({ mode: 'create' })}
          >
            Tạo kế hoạch ngày/bữa
          </button>
        )
      }
    >
      <Filters query={query} setQuery={setQuery} />
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      <Table
        rows={state.data || []}
        columns={[
          ['planDate', 'Ngày'],
          ['mealPeriod', 'Bữa'],
          ['status', 'Trạng thái'],
          [
            'batches',
            'Mẻ',
            (r) =>
              r.batches
                ?.map(
                  (b) =>
                    `${productName(b.productId)} (${b.source}) ${Number(b.plannedQuantity) + Number(b.adjustmentQuantity)}`,
                )
                .join(', '),
          ],
        ]}
        actions={
          manager
            ? (r) => (
                <>
                  {r.status === 'DRAFT' && (
                    <ActionButton disabled={busy} onClick={() => lock(r)}>
                      Khóa và sinh mẻ
                    </ActionButton>
                  )}
                  <ActionButton
                    onClick={() => setDialog({ mode: 'adjust', row: r })}
                  >
                    Điều chỉnh số suất
                  </ActionButton>
                </>
              )
            : undefined
        }
      />
      {dialog && (
        <Dialog
          title={
            dialog.mode === 'create' ? 'Kế hoạch bán trú' : 'Điều chỉnh mẻ'
          }
          initial={{ date: query.date, mealPeriod: 'LUNCH' }}
          onClose={() => setDialog(null)}
          onSubmit={async (v) => {
            if (dialog.mode === 'create')
              await api.create('/kitchen/meal-plans', { ...v, branchId })
            else
              await api.action(
                '/kitchen/meal-plans',
                dialog.row.id,
                'adjustments',
                v,
              )
            await state.reload()
          }}
        >
          {(v, change) =>
            dialog.mode === 'create' ? (
              <>
                <Field
                  label="Ngày"
                  type="date"
                  value={v.date}
                  onChange={(x) => change('date', x)}
                />
                <Field
                  label="Bữa"
                  options={['BREAKFAST', 'LUNCH', 'AFTERNOON', 'DINNER']}
                  value={v.mealPeriod}
                  onChange={(x) => change('mealPeriod', x)}
                />
              </>
            ) : (
              <>
                <Field
                  label="Mẻ cần điều chỉnh"
                  options={dialog.row.batches.map((b) => ({
                    id: b.id,
                    name: productName(b.productId),
                  }))}
                  value={v.batchId}
                  onChange={(x) => change('batchId', x)}
                />
                <Field
                  label="Số suất tăng/giảm"
                  type="number"
                  value={v.quantity}
                  onChange={(x) => change('quantity', x)}
                />
                <Field
                  label="Lý do"
                  value={v.reason}
                  onChange={(x) => change('reason', x)}
                />
              </>
            )
          }
        </Dialog>
      )}
    </PageFrame>
  )
}
export function SummaryPage({ report = false, history = false }) {
  const { manager } = useAuth(),
    [query, setQuery] = useState(() => ({
      ...defaultQuery(),
      from: defaultQuery().date,
      to: defaultQuery().date,
    }))
  const state = useKitchenData(
    history
      ? '/kitchen/history'
      : report
        ? '/kitchen/reports/meal-flow'
        : '/kitchen/dashboard',
    history ? query : { from: query.from, to: query.to, shift: query.shift },
  )
  const operations = useKitchenData(
    '/kitchen/reports/operations',
    { from: query.from, to: query.to },
    manager && !history,
  )
  return (
    <PageFrame
      title={
        history
          ? 'Lịch sử nhập - xuất và thao tác'
          : report
            ? 'Báo cáo bếp'
            : 'Tổng quan bếp'
      }
      state={state}
      action={
        !history && (
          <button className={buttonClass} onClick={() => window.print()}>
            In báo cáo
          </button>
        )
      }
    >
      <Filters query={query} setQuery={setQuery} ranges={!history} />
      {history ? (
        <>
          <Table
            rows={state.data?.data || []}
            columns={[
              [
                'createdAt',
                'Thời gian',
                (r) => new Date(r.createdAt).toLocaleString('vi-VN'),
              ],
              ['resource', 'Nghiệp vụ', (r) => r.payload.resource],
              ['status', 'Thao tác'],
              ['actor', 'Người thao tác', (r) => r.payload.actorId],
              ['doc', 'Chứng từ', (r) => r.parentId?.slice(0, 8)],
            ]}
          />
          <Pagination data={state.data} query={query} setQuery={setQuery} />
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Object.entries(state.data || {}).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  {summaryLabels[key] || key}
                </p>
                <p className="mt-2 text-xl font-bold text-blue-700">
                  {Array.isArray(value)
                    ? value.map((r) => `${r.status}: ${r.count}`).join(', ')
                    : value}
                </p>
              </div>
            ))}
          </div>
          {manager && operations.data && (
            <div className="rounded-xl bg-white p-5">
              <h2 className="text-xl font-bold">Vận hành căn tin / bán trú</h2>
              <p>
                Chờ trung bình:{' '}
                {Number(
                  operations.data.timings?.averageWaitMinutes || 0,
                ).toFixed(1)}{' '}
                phút · Chế biến:{' '}
                {Number(
                  operations.data.timings?.averagePreparationMinutes || 0,
                ).toFixed(1)}{' '}
                phút
              </p>
              <p>
                Số suất kế hoạch: {operations.data.mealTotals?.plannedQuantity}{' '}
                · Sản lượng thực tế:{' '}
                {operations.data.mealTotals?.actualQuantity}
              </p>
              <p>Lần thiếu nguyên liệu: {operations.data.shortages?.count}</p>
            </div>
          )}
        </>
      )}
    </PageFrame>
  )
}
