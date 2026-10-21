import { localInput, summaryLabels } from './portalHelpers'
import { defaultQuery } from './portalHelpers'
import { useState } from 'react'
import { api } from '../../api/kitchenApi'
import { useAuth } from '../../auth/authContext'
import { useKitchenData, useKitchenChoices } from '../../hooks/useKitchenData'
import { useCatalog, today, toInstant } from './portalHelpers'
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

const titles = {
  menus: 'Thực đơn theo ngày/tuần',
  'manual-plans': 'Kế hoạch thủ công',
  'finished-imports': 'Nhập món thành phẩm',
  'finished-exports': 'Xuất món',
  'finished-inventory': 'Món còn lại',
  disposals: 'Hủy món',
  samples: 'Quản lý lưu mẫu',
  'shift-closings': 'Chốt ca',
}
const labels = {
  DRAFT: 'Nháp',
  LOCKED: 'Đã khóa',
  CONFIRMED: 'Đã xác nhận',
  EXPORTED: 'Đã xuất',
  STORED: 'Đang lưu',
  PROCESSED: 'Đã xử lý',
  ACTIVE: 'Đang theo dõi',
  PENDING: 'Chờ quản lý',
  COMPLETED: 'Hoàn tất',
}
export function DocumentPage({ kind, historyOnly = false }) {
  const { branchId, manager, session } = useAuth()
  const menuEditor =
    manager || (kind === 'menus' && ['KITCHEN', 'HEAD_CHEF'].includes(session.userType))
  const [query, setQuery] = useState(defaultQuery),
    [dialog, setDialog] = useState(null),
    [actionError, setActionError] = useState(''),
    [busy, setBusy] = useState(false)
  const catalog = useCatalog([
    ...(kind === 'shift-closings' ? [] : ['products']),
    ...(dialog && kind === 'manual-plans' ? ['stations'] : []),
  ])
  const resource = `/kitchen/${kind}`,
    state = useKitchenData(
      resource,
      kind === 'menus' && query.from ? { ...query, date: undefined } : query,
    )
  const editing = ['create', 'edit'].includes(dialog?.mode)
  const plans = useKitchenData(
    '/kitchen/meal-plans',
    { date: query.date },
    editing && ['finished-imports', 'samples'].includes(kind),
  )
  const inventory = useKitchenChoices(
    '/kitchen/finished-inventory',
    { date: query.date },
    editing && ['finished-exports', 'disposals'].includes(kind),
  )
  const batches = (plans.data || []).flatMap((p) =>
    (p.batches || []).map((b) => ({
      ...b,
      date: p.planDate,
      name: `${catalog.productName(b.productId)} · ${b.source} · ${b.status} · ${b.id.slice(0, 8)}`,
    })),
  )
  const lots = (inventory.data || []).map((r) => ({
    ...r,
    name: `${catalog.productName(r.payload.productId)} · ${r.payload.lotCode} · còn ${r.payload.availableQuantity} · cách ly ${r.payload.quarantinedQuantity}`,
  }))
  const canCreate =
    !historyOnly &&
    !['finished-inventory'].includes(kind) &&
    (!['menus', 'manual-plans'].includes(kind) || menuEditor)
  async function mutate(row, action, body = {}) {
    if (busy) return
    setBusy(true)
    setActionError('')
    try {
      await api.action(resource, row.id, action, { ...body, branchId })
      window.dispatchEvent(new Event('kitchen:reload'))
    } catch (e) {
      setActionError(e.message)
      if (e.status === 409) await state.reload()
    } finally {
      setBusy(false)
    }
  }
  function open(mode, row) {
    setDialog({ mode, row, initialTime: localInput(new Date().toISOString()) })
  }
  const columns = [
    ['id', 'Mã', (r) => r.id.slice(0, 8)],
    ['date', 'Ngày'],
    ['shift', 'Ca'],
    [
      'product',
      'Món / nội dung',
      (r) =>
        r.payload.title ||
        (r.payload.items
          ? r.payload.items
              .map((i) => catalog.productName(i.productId))
              .join(', ')
          : catalog.productName(r.payload.productId) || 'Chốt ca'),
    ],
    [
      'quantity',
      kind === 'finished-inventory' ? 'Tồn vật lý' : 'Số lượng',
      (r) =>
        r.payload.physicalQuantity ??
        r.payload.quantity ??
        r.payload.availableQuantity ??
        '—',
    ],
    ...(kind === 'finished-inventory'
      ? [
          ['usable', 'Có thể phục vụ', (r) => r.payload.usableQuantity],
          ['expired', 'Quá hạn chưa cách ly', (r) => r.payload.expiredQuantity],
          ['quarantine', 'Cách ly', (r) => r.payload.quarantinedQuantity],
        ]
      : []),
    ['status', 'Trạng thái', (r) => labels[r.status] || r.status],
    [
      'expiry',
      'Hạn sử dụng / lưu',
      (r) =>
        r.payload.expiresAt || r.payload.expectedEndAt
          ? new Date(
              r.payload.expiresAt || r.payload.expectedEndAt,
            ).toLocaleString('vi-VN')
          : '—',
    ],
  ]
  return (
    <PageFrame
      title={titles[kind]}
      description="Dữ liệu dùng chung từ máy chủ theo ngày sản xuất và ca."
      state={state}
      action={
        canCreate && (
          <button className={buttonClass} onClick={() => open('create')}>
            Tạo mới
          </button>
        )
      }
    >
      {kind === 'menus' && (
        <div className="flex gap-2">
          <button
            className={
              !query.from ? buttonClass : 'rounded-lg border px-4 py-2'
            }
            onClick={() =>
              setQuery((current) => ({
                date: current.date,
                shift: current.shift,
                size: current.size,
                page: 1,
              }))
            }
          >
            Theo ngày
          </button>
          <button
            className={query.from ? buttonClass : 'rounded-lg border px-4 py-2'}
            onClick={() => {
              const start = new Date(`${query.date}T00:00:00Z`)
              start.setUTCDate(
                start.getUTCDate() - ((start.getUTCDay() + 6) % 7),
              )
              const from = start.toISOString().slice(0, 10)
              start.setUTCDate(start.getUTCDate() + 6)
              setQuery({
                ...query,
                from,
                to: start.toISOString().slice(0, 10),
                page: 1,
              })
            }}
          >
            Theo tuần / khoảng ngày
          </button>
        </div>
      )}
      <Filters
        query={query}
        setQuery={setQuery}
        ranges={kind === 'menus' && Boolean(query.from)}
      />
      {(inventory.error || plans.error) && (
        <p role="alert" className="text-red-600">
          {inventory.error || plans.error}
        </p>
      )}
      {actionError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
          {actionError}
        </p>
      )}
      <Table
        rows={state.data?.data || []}
        columns={columns}
        actions={
          historyOnly
            ? undefined
            : (r) => (
                <>
                  {r.status === 'DRAFT' &&
                    ['menus', 'manual-plans', 'finished-imports'].includes(
                      kind,
                    ) &&
                    (!['menus', 'manual-plans'].includes(kind) ||
                      menuEditor) && (
                      <ActionButton
                        disabled={busy}
                        onClick={() => open('edit', r)}
                      >
                        Sửa
                      </ActionButton>
                    )}
                  {['menus', 'manual-plans'].includes(kind) && menuEditor && (
                    <ActionButton
                      disabled={busy}
                      onClick={() => open('copy', r)}
                    >
                      Sao chép
                    </ActionButton>
                  )}
                  {kind === 'menus' && menuEditor && r.status === 'DRAFT' && (
                    <ActionButton
                      disabled={busy}
                      onClick={() => mutate(r, 'lock')}
                    >
                      Khóa thực đơn
                    </ActionButton>
                  )}
                  {kind === 'manual-plans' &&
                    manager &&
                    r.payload.items
                      .filter((i) => !i.batchId)
                      .map((line) => (
                        <ActionButton
                          key={line.id}
                          disabled={busy}
                          onClick={() =>
                            mutate(r, 'confirm', { lineId: line.id })
                          }
                        >
                          Chuyển bếp: {catalog.productName(line.productId)}
                        </ActionButton>
                      ))}
                  {kind === 'finished-imports' && r.status === 'DRAFT' && (
                    <ActionButton
                      disabled={busy}
                      onClick={() => mutate(r, 'confirm')}
                    >
                      Xác nhận nhập
                    </ActionButton>
                  )}
                  {kind === 'finished-exports' && (
                    <ActionButton
                      disabled={busy}
                      onClick={() => open('returns', r)}
                    >
                      Thu hồi một phần
                    </ActionButton>
                  )}
                  {kind === 'finished-inventory' && manager && (
                    <>
                      <ActionButton
                        disabled={busy}
                        onClick={() => open('adjustments', r)}
                      >
                        Điều chỉnh
                      </ActionButton>
                      {Number(r.payload.quarantinedQuantity) > 0 && (
                        <ActionButton
                          disabled={busy}
                          onClick={() => open('release', r)}
                        >
                          Cho phục vụ lại
                        </ActionButton>
                      )}
                    </>
                  )}
                  {kind === 'disposals' &&
                    r.status === 'PENDING' &&
                    manager && (
                      <ActionButton
                        disabled={busy}
                        onClick={() => mutate(r, 'confirm')}
                      >
                        Xác nhận hủy
                      </ActionButton>
                    )}
                  {kind === 'samples' && r.status !== 'PROCESSED' && (
                    <>
                      <ActionButton
                        disabled={busy}
                        onClick={() => open('edit', r)}
                      >
                        Sửa mẫu
                      </ActionButton>
                      <ActionButton
                        disabled={busy}
                        onClick={() => open('process', r)}
                      >
                        Xử lý mẫu
                      </ActionButton>
                    </>
                  )}
                  {kind === 'shift-closings' && (
                    <>
                      {r.status === 'DRAFT' && (
                        <ActionButton
                          disabled={busy}
                          onClick={() => mutate(r, 'confirm')}
                        >
                          Nhân viên xác nhận
                        </ActionButton>
                      )}
                      {r.status === 'CONFIRMED' && manager && (
                        <ActionButton
                          disabled={busy}
                          onClick={() => mutate(r, 'approve')}
                        >
                          Duyệt và khóa
                        </ActionButton>
                      )}
                      {['LOCKED', 'CONFIRMED'].includes(r.status) &&
                        manager && (
                          <ActionButton
                            disabled={busy}
                            onClick={() => open('reopen', r)}
                          >
                            Mở lại
                          </ActionButton>
                        )}
                      <ActionButton onClick={() => open('detail', r)}>
                        Báo cáo ca
                      </ActionButton>
                    </>
                  )}
                </>
              )
        }
      />
      <Pagination data={state.data} query={query} setQuery={setQuery} />
      {dialog && dialog.mode !== 'detail' && (
        <Dialog
          title={`${dialog.mode === 'edit' ? 'Chỉnh sửa' : 'Ghi nhận'} · ${titles[kind]}`}
          onClose={() => setDialog(null)}
          initial={{
            date: query.date,
            shift: query.shift || 'Ca trưa',
            mealPeriod: 'LUNCH',
            importedAt: dialog.initialTime,
            sampledAt: dialog.initialTime,
            storageLocation: '',
            unit: 'g',
            pool: 'AVAILABLE',
            receivedBy: '',
            deliveredBy: session.fullName,
            items: [],
            ...(dialog.row?.payload || {}),
          }}
          onSubmit={async (v) => {
            if (!['create', 'edit'].includes(dialog.mode))
              await api.action(resource, dialog.row.id, dialog.mode, {
                ...v,
                branchId,
                date: v.date,
              })
            else {
              const value = { ...v, branchId }
              for (const key of [
                'importedAt',
                'sampledAt',
                'storageStartedAt',
                'expectedEndAt',
              ])
                if (value[key]) value[key] = toInstant(value[key])
              if (kind === 'manual-plans')
                value.items = value.items.map((i) => ({
                  ...i,
                  plannedStartAt: toInstant(i.plannedStartAt),
                  deadline: toInstant(i.deadline),
                }))
              if (dialog.mode === 'edit')
                await api.update(resource, dialog.row.id, {
                  ...value,
                  expectedVersion: dialog.row.version,
                })
              else await api.create(resource, value)
            }
            window.dispatchEvent(new Event('kitchen:reload'))
          }}
        >
          {(v, change) => (
            <>
              {dialog.mode === 'copy' ? (
                <>
                  <Field
                    label="Ngày đích"
                    type="date"
                    value={v.date}
                    onChange={(x) => change('date', x)}
                  />
                  <Field
                    label="Ca đích"
                    options={['Ca sáng', 'Ca trưa', 'Ca chiều']}
                    value={v.shift}
                    onChange={(x) => change('shift', x)}
                  />
                </>
              ) : [
                  'returns',
                  'adjustments',
                  'release',
                  'process',
                  'reopen',
                ].includes(dialog.mode) ? (
                <>
                  {['returns', 'adjustments', 'release'].includes(
                    dialog.mode,
                  ) && (
                    <Field
                      label="Số lượng"
                      type="number"
                      min={dialog.mode === 'adjustments' ? undefined : 0.0001}
                      step="0.0001"
                      value={v.quantity}
                      onChange={(x) => change('quantity', x)}
                    />
                  )}
                  <Field
                    label="Lý do"
                    value={v.reason}
                    onChange={(x) => change('reason', x)}
                  />
                </>
              ) : (
                <DocumentFields
                  kind={kind}
                  value={v}
                  change={change}
                  batches={batches}
                  lots={lots}
                  catalog={catalog}
                  edit={dialog.mode === 'edit'}
                />
              )}
            </>
          )}
        </Dialog>
      )}
      {dialog?.mode === 'detail' && (
        <div className="rounded-xl bg-white p-5">
          <h2 className="text-lg font-bold">
            Báo cáo ca · {dialog.row.status}
          </h2>
          <div className="mt-3 grid gap-2">
            {Object.entries(dialog.row.payload.snapshot || {}).map(
              ([key, value]) => (
                <p key={key}>
                  {summaryLabels[key] || key}:{' '}
                  {Array.isArray(value)
                    ? value.map((r) => `${r.status}: ${r.count}`).join(', ')
                    : String(value)}
                </p>
              ),
            )}
          </div>
          <p>
            Người xác nhận: {dialog.row.payload.confirmedBy || 'Chưa xác nhận'}{' '}
            · Người duyệt: {dialog.row.payload.approvedBy || 'Chưa duyệt'}
          </p>
          <button onClick={() => setDialog(null)}>Đóng</button>
        </div>
      )}
    </PageFrame>
  )
}
function DocumentFields({
  kind,
  value: v,
  change,
  batches,
  lots,
  catalog,
  edit,
}) {
  const commonDate = ['menus', 'manual-plans', 'shift-closings'].includes(kind)
  const dishes = catalog.products.filter(
    (p) => p.productType === 'FINISHED_GOOD',
  )
  return (
    <>
      {commonDate && (
        <>
          <Field
            disabled={edit}
            label="Ngày"
            type="date"
            value={v.date || today()}
            onChange={(x) => change('date', x)}
          />
          <Field
            disabled={edit}
            label="Ca"
            options={['Ca sáng', 'Ca trưa', 'Ca chiều']}
            value={v.shift}
            onChange={(x) => change('shift', x)}
          />
        </>
      )}
      {['menus', 'manual-plans'].includes(kind) && (
        <>
          <Field
            label="Tiêu đề"
            value={v.title}
            onChange={(x) => change('title', x)}
          />
          <Field
            label="Bữa"
            options={[
              { id: 'BREAKFAST', name: 'Bữa sáng' },
              { id: 'LUNCH', name: 'Bữa trưa' },
              { id: 'AFTERNOON', name: 'Bữa xế' },
              { id: 'DINNER', name: 'Bữa tối' },
            ]}
            value={v.mealPeriod}
            onChange={(x) => change('mealPeriod', x)}
          />
        </>
      )}
      {kind === 'menus' && (
        <Field
          label="Danh sách món (chọn nhiều)"
          multiple
          options={dishes}
          value={v.productIds || []}
          onChange={(x) => change('productIds', x)}
        />
      )}
      {kind === 'manual-plans' && (
        <>
          <div className="grid gap-4">
            {(v.items || []).map((line, index) => (
              <fieldset
                key={line.id || index}
                className="grid gap-3 rounded-lg border p-3"
                disabled={Boolean(line.batchId)}
              >
                <legend>
                  Món {index + 1}
                  {line.batchId && ' · Đã chuyển bếp'}
                </legend>
                <Field
                  label="Món"
                  options={dishes}
                  value={line.productId}
                  onChange={(x) =>
                    change(
                      'items',
                      v.items.map((i, n) =>
                        n === index ? { ...i, productId: x } : i,
                      ),
                    )
                  }
                />
                {[
                  ['expectedQuantity', 'Số suất', 'number'],
                  ['shift', 'Ca sản xuất', 'text'],
                  ['plannedStartAt', 'Bắt đầu dự kiến', 'datetime-local'],
                  ['deadline', 'Hạn hoàn thành', 'datetime-local'],
                  ['serviceArea', 'Nơi phục vụ', 'text'],
                  ['assignedTo', 'Tổ phụ trách', 'text'],
                  ['ingredients', 'Mô tả nguyên liệu', 'text'],
                  ['note', 'Ghi chú dòng', 'text'],
                ].map(([key, label, type]) => (
                  <Field
                    key={key}
                    required={
                      !['ingredients', 'assignedTo', 'note'].includes(key)
                    }
                    label={label}
                    type={type}
                    min={type === 'number' ? 1 : undefined}
                    value={
                      type === 'datetime-local'
                        ? localInput(line[key])
                        : line[key]
                    }
                    onChange={(x) =>
                      change(
                        'items',
                        v.items.map((i, n) =>
                          n === index ? { ...i, [key]: x } : i,
                        ),
                      )
                    }
                  />
                ))}
                <Field
                  label="Trạm bếp"
                  options={catalog.stations}
                  value={line.stationId}
                  onChange={(x) =>
                    change(
                      'items',
                      v.items.map((i, n) =>
                        n === index ? { ...i, stationId: x } : i,
                      ),
                    )
                  }
                />
                {!line.batchId && (
                  <button
                    type="button"
                    onClick={() =>
                      change(
                        'items',
                        v.items.filter((_, n) => n !== index),
                      )
                    }
                  >
                    Bỏ dòng
                  </button>
                )}
              </fieldset>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              change('items', [
                ...(v.items || []),
                {
                  id: crypto.randomUUID(),
                  shift: v.shift,
                  expectedQuantity: 1,
                  plannedStartAt: `${v.date}T08:00`,
                  deadline: `${v.date}T10:00`,
                },
              ])
            }
          >
            + Thêm món
          </button>
        </>
      )}
      {['finished-imports', 'samples'].includes(kind) && (
        <Field
          disabled={edit}
          label="Mẻ chế biến"
          options={batches.filter((b) =>
            kind === 'samples'
              ? ['PREPARING', 'READY', 'COMPLETED'].includes(b.status)
              : b.status === 'COMPLETED',
          )}
          value={v.batchId}
          onChange={(x) => change('batchId', x)}
        />
      )}
      {['finished-exports', 'disposals'].includes(kind) && (
        <Field
          label="Lô thành phẩm"
          options={lots}
          value={v.lotId}
          onChange={(x) => change('lotId', x)}
        />
      )}
      {[
        'finished-imports',
        'finished-exports',
        'disposals',
        'samples',
      ].includes(kind) && (
        <Field
          label="Số lượng"
          type="number"
          min="0.0001"
          step="0.0001"
          value={v.quantity}
          onChange={(x) => change('quantity', x)}
        />
      )}
      {kind === 'finished-imports' && (
        <>
          <Field
            label="Khu vực nhận"
            value={v.receiverArea}
            onChange={(x) => change('receiverArea', x)}
          />
          <Field
            label="Thời gian nhập"
            type="datetime-local"
            value={localInput(v.importedAt)}
            onChange={(x) => change('importedAt', x)}
          />
        </>
      )}
      {kind === 'finished-exports' && (
        <>
          <Field
            label="Nơi nhận"
            value={v.receiverPlace}
            onChange={(x) => change('receiverPlace', x)}
          />
          <Field
            label="Người nhận"
            value={v.receivedBy}
            onChange={(x) => change('receivedBy', x)}
          />
          <Field
            label="Người giao"
            value={v.deliveredBy}
            onChange={(x) => change('deliveredBy', x)}
          />
        </>
      )}
      {kind === 'disposals' && (
        <>
          <Field
            label="Nguồn tồn"
            options={[
              { id: 'AVAILABLE', name: 'Tồn tại bếp' },
              { id: 'QUARANTINED', name: 'Hàng cách ly' },
            ]}
            value={v.pool}
            onChange={(x) => change('pool', x)}
          />
          <Field
            label="Lý do hủy"
            value={v.reason}
            onChange={(x) => change('reason', x)}
          />
          <ImageField
            value={v.imageUrl}
            onChange={(x) => change('imageUrl', x)}
          />
        </>
      )}
      {kind === 'samples' && (
        <>
          <Field
            label="Đơn vị mẫu"
            options={['g', 'ml']}
            value={v.unit}
            onChange={(x) => change('unit', x)}
          />
          <Field
            label="Vị trí lưu"
            value={v.storageLocation}
            onChange={(x) => change('storageLocation', x)}
          />
          {[
            ['sampledAt', 'Thời gian lấy mẫu'],
            ['storageStartedAt', 'Bắt đầu lưu'],
            ['expectedEndAt', 'Dự kiến xử lý'],
          ].map(([key, label]) => (
            <Field
              key={key}
              required={key === 'sampledAt'}
              label={label}
              type="datetime-local"
              value={localInput(v[key])}
              onChange={(x) => change(key, x)}
            />
          ))}
          <ImageField
            value={v.imageUrl}
            onChange={(x) => change('imageUrl', x)}
          />
        </>
      )}
      <Field
        required={false}
        label="Ghi chú"
        value={v.note}
        onChange={(x) => change('note', x)}
      />
    </>
  )
}
