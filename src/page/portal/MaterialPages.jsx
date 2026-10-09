import { useEffect, useState } from 'react'
import { api, allPages } from '../../api/kitchenApi'
import { useAuth } from '../../auth/authContext'
import { useCatalog, today } from './portalHelpers'
import { useKitchenData } from '../../hooks/useKitchenData'
import { WarehouseDocuments } from './WarehouseDocuments'
import {
  ActionButton,
  Dialog,
  Field,
  PageFrame,
  Pagination,
  Table,
  buttonClass,
} from './PortalUI'

export function Allocations({
  productId,
  quantity,
  value = [],
  onChange,
  allowExpired = false,
}) {
  const { branchId } = useAuth(),
    [result, setResult] = useState({})
  const scope = `${branchId}:${productId}:${allowExpired}`,
    lots = result.scope === scope ? result.lots || [] : [],
    error = result.scope === scope ? result.error : ''
  useEffect(() => {
    const abort = new AbortController()
    allPages(
      '/stock-lots',
      { branchId, productId, status: allowExpired ? undefined : 'AVAILABLE' },
      abort.signal,
    )
      .then((lots) => {
        if (!abort.signal.aborted) setResult({ scope, lots })
      })
      .catch((e) => {
        if (!abort.signal.aborted) setResult({ scope, error: e.message })
      })
    return () => abort.abort()
  }, [branchId, productId, allowExpired, scope])
  return (
    <fieldset className="grid gap-2 rounded-lg border border-blue-100 p-3">
      <legend>Chọn lô · cần {quantity} theo đơn vị tồn</legend>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {lots.map((lot) => (
        <label
          key={lot.id}
          className="flex flex-wrap items-center gap-3 text-sm"
        >
          <span className="min-w-48">
            {lot.lotCode} · tồn {lot.quantity} · hạn{' '}
            {lot.expiresAt || 'Không áp dụng'}
          </span>
          <input
            className="w-28 rounded border p-2"
            type="number"
            min="0"
            max={lot.quantity}
            step="0.0001"
            value={value.find((a) => a.lotId === lot.id)?.quantity || ''}
            onChange={(e) => {
              const remaining = value.filter((a) => a.lotId !== lot.id)
              onChange(
                Number(e.target.value) > 0
                  ? [
                      ...remaining,
                      { lotId: lot.id, quantity: Number(e.target.value) },
                    ]
                  : remaining,
              )
            }}
          />
        </label>
      ))}
      {!lots.length && !error && <p>Không có lô phù hợp.</p>}
      <p className="text-sm">
        Đã phân bổ: {value.reduce((s, a) => s + Number(a.quantity), 0)}
      </p>
    </fieldset>
  )
}
export function MaterialsPage({ lotsOnly = false }) {
  const { branchId, manager } = useAuth(),
    catalog = useCatalog(),
    [query, setQuery] = useState({
      page: 1,
      size: 20,
      productType: 'INGREDIENT',
    }),
    [dialog, setDialog] = useState(null),
    [suppliers, setSuppliers] = useState([]),
    [supplierError, setSupplierError] = useState('')
  const state = useKitchenData(
    lotsOnly ? '/stock-lots' : '/inventory-items',
    query,
  )
  useEffect(() => {
    if (!manager) return
    const abort = new AbortController()
    allPages('/suppliers', { branchId }, abort.signal)
      .then(setSuppliers)
      .catch((e) => {
        if (!abort.signal.aborted) setSupplierError(e.message)
      })
    return () => abort.abort()
  }, [branchId, manager])
  const products = catalog.products.filter((p) =>
    ['INGREDIENT', 'FUEL'].includes(p.productType),
  )
  const [openingError, setOpeningError] = useState(''),
    [openingBusy, setOpeningBusy] = useState(false)
  async function openOpening(row) {
    if (openingBusy) return
    setOpeningBusy(true)
    setOpeningError('')
    try {
      const preview = await api.list('/stock-lots/opening-preview', {
        branchId,
        productId: row.id,
      })
      if (preview.requiresAdmin)
        throw new Error(
          'Hàng còn tồn ở chi nhánh khác. ADMIN cần đối chiếu và phân bổ tất cả kho trong một lần.',
        )
      setDialog({
        mode: 'opening',
        row,
        stockAllocations: preview.stockAllocations.map((s) => ({
          ...s,
          lots: [],
        })),
      })
    } catch (error) {
      setOpeningError(error.message)
    } finally {
      setOpeningBusy(false)
    }
  }
  return (
    <PageFrame
      title={lotsOnly ? 'Lô nguyên/nhiên liệu' : 'Nguyên/nhiên liệu'}
      description="Nhập từ nhà cung cấp, theo dõi tồn vật lý và chọn lô khi xuất."
      state={state}
      action={
        manager && (
          <div className="flex gap-2">
            <button
              className={buttonClass}
              onClick={() => setDialog({ mode: 'import' })}
            >
              Nhập nguyên/nhiên liệu
            </button>
            <button
              className={buttonClass}
              onClick={() => setDialog({ mode: 'export' })}
            >
              Xuất sử dụng / hủy
            </button>
          </div>
        )
      }
    >
      <div className="flex gap-3 rounded-xl bg-white p-4">
        <Field
          label="Loại hàng"
          options={[
            { id: 'INGREDIENT', name: 'Nguyên liệu' },
            { id: 'FUEL', name: 'Nhiên liệu' },
          ]}
          value={query.productType}
          onChange={(productType) =>
            setQuery({ ...query, page: 1, productType })
          }
        />
        {lotsOnly && (
          <Field
            label="Tình trạng lô"
            required={false}
            options={[
              { id: 'AVAILABLE', name: 'Còn hạn' },
              { id: 'EXPIRED', name: 'Hết hạn' },
            ]}
            value={query.status || ''}
            onChange={(status) => setQuery({ ...query, page: 1, status })}
          />
        )}
      </div>
      {supplierError && (
        <p role="alert" className="text-red-600">
          Không tải được nhà cung cấp: {supplierError}
        </p>
      )}
      <Table
        rows={state.data?.data || []}
        columns={
          lotsOnly
            ? [
                ['productId', 'Hàng', (r) => catalog.productName(r.productId)],
                ['lotCode', 'Lô'],
                ['quantity', 'Tồn vật lý'],
                ['expiresAt', 'Hạn dùng'],
              ]
            : [
                ['name', 'Hàng'],
                [
                  'unit',
                  'Đơn vị tồn',
                  (r) =>
                    catalog.units.find((u) => u.id === r.baseUnitId)?.code ||
                    r.unit,
                ],
                ['quantity', 'Tồn vật lý'],
                ['availableQuantity', 'Có thể sử dụng'],
                ['expiredQuantity', 'Hết hạn'],
                [
                  'lotTrackingEnabled',
                  'Theo lô',
                  (r) => (r.lotTrackingEnabled ? 'Đã bật' : 'Chưa bật'),
                ],
              ]
        }
        actions={
          !lotsOnly && manager
            ? (r) =>
                !r.lotTrackingEnabled && (
                  <ActionButton
                    disabled={openingBusy}
                    onClick={() => openOpening(r)}
                  >
                    Phân bổ tồn mở đầu
                  </ActionButton>
                )
            : undefined
        }
      />
      <Pagination data={state.data} query={query} setQuery={setQuery} />
      {!lotsOnly && <WarehouseDocuments />}
      {openingError && (
        <p role="alert" className="text-red-600">
          {openingError}
        </p>
      )}
      {dialog && (
        <Dialog
          title={
            dialog.mode === 'opening'
              ? 'Đối chiếu và phân bổ tồn mở đầu'
              : dialog.mode === 'import'
                ? 'Nhập nguyên/nhiên liệu'
                : 'Xuất nguyên/nhiên liệu'
          }
          initial={{
            date: today(),
            purpose: 'USE',
            paymentStatus: 'PAID',
            items: [
              {
                productId: dialog.row?.id || '',
                quantity: dialog.row?.quantity || 1,
                unitPrice: 0,
                allocations: [],
              },
            ],
            lots: [],
            stockAllocations: dialog.stockAllocations || [],
          }}
          onClose={() => setDialog(null)}
          onSubmit={async (v) => {
            if (dialog.mode === 'opening')
              await api.create('/stock-lots/opening', {
                branchId,
                productId: dialog.row.id,
                requestId: v.requestId,
                note: v.note,
                ...(v.stockAllocations.length
                  ? {
                      stockAllocations: v.stockAllocations.map((s) => ({
                        stockId: s.stockId,
                        lots: s.lots,
                      })),
                    }
                  : { lots: v.lots }),
              })
            else
              await api.create(
                `/stock-vouchers/${dialog.mode === 'import' ? 'imports' : 'exports'}`,
                {
                  ...v,
                  branchId,
                  type: dialog.mode === 'import' ? 'IMPORT' : 'EXPORT',
                  sourceType: dialog.mode === 'import' ? 'SUPPLIER' : 'BRANCH',
                  sourceId: dialog.mode === 'import' ? v.sourceId : branchId,
                  items: v.items.map((i) => ({
                    ...i,
                    unitId:
                      dialog.mode === 'import'
                        ? i.unitId || undefined
                        : undefined,
                    unitPrice: dialog.mode === 'import' ? i.unitPrice : 0,
                  })),
                },
              )
            catalog.refreshCatalog()
            await state.reload()
          }}
        >
          {(v, change) =>
            dialog.mode === 'opening' ? (
              <>
                <p>
                  Tồn hiện tại:{' '}
                  <strong>
                    {dialog.row.quantity} {dialog.row.unit}
                  </strong>
                  . Tổng các lô phải khớp đúng; số dư không tự quy đổi.
                </p>
                {v.stockAllocations.length ? (
                  v.stockAllocations.map((stock, index) => (
                    <fieldset
                      className="grid gap-3 rounded border p-3"
                      key={stock.stockId}
                    >
                      <legend>
                        {stock.stockName} · {stock.branchName || 'Chi nhánh'} ·
                        tồn {stock.quantity}
                      </legend>
                      <LotOpening
                        value={stock.lots}
                        onChange={(lots) =>
                          change(
                            'stockAllocations',
                            v.stockAllocations.map((s, n) =>
                              n === index ? { ...s, lots } : s,
                            ),
                          )
                        }
                        expiryRequired={dialog.row.productType === 'INGREDIENT'}
                      />
                    </fieldset>
                  ))
                ) : (
                  <LotOpening
                    value={v.lots}
                    onChange={(lots) => change('lots', lots)}
                    expiryRequired={dialog.row.productType === 'INGREDIENT'}
                  />
                )}
                <Field
                  required={false}
                  label="Ghi chú"
                  value={v.note}
                  onChange={(x) => change('note', x)}
                />
              </>
            ) : (
              <>
                {dialog.mode === 'import' ? (
                  <>
                    <Field
                      label="Nhà cung cấp"
                      options={suppliers}
                      value={v.sourceId}
                      onChange={(x) => change('sourceId', x)}
                    />
                    <Field
                      label="Thanh toán"
                      options={[
                        { id: 'PAID', name: 'Đã thanh toán' },
                        { id: 'DEBT', name: 'Ghi công nợ' },
                      ]}
                      value={v.paymentStatus}
                      onChange={(x) => change('paymentStatus', x)}
                    />
                  </>
                ) : (
                  <Field
                    label="Mục đích"
                    options={[
                      { id: 'USE', name: 'Sử dụng' },
                      { id: 'DISPOSAL', name: 'Hủy (cho phép lô hết hạn)' },
                    ]}
                    value={v.purpose}
                    onChange={(x) => change('purpose', x)}
                  />
                )}
                {(v.items || []).map((item, index) => {
                  const product = products.find((p) => p.id === item.productId)
                  const set = (key, x) =>
                    change(
                      'items',
                      v.items.map((i, n) =>
                        n === index ? { ...i, [key]: x } : i,
                      ),
                    )
                  return (
                    <fieldset
                      className="grid gap-3 rounded-lg border p-3"
                      key={index}
                    >
                      <legend>Hàng {index + 1}</legend>
                      <Field
                        label="Nguyên/nhiên liệu"
                        options={products}
                        value={item.productId}
                        onChange={(x) => {
                          change(
                            'items',
                            v.items.map((i, n) =>
                              n === index
                                ? { ...i, productId: x, allocations: [] }
                                : i,
                            ),
                          )
                        }}
                      />
                      <Field
                        label={
                          dialog.mode === 'import'
                            ? 'Số lượng nhập'
                            : 'Số lượng theo đơn vị tồn'
                        }
                        type="number"
                        min="0.0001"
                        step="0.0001"
                        value={item.quantity}
                        onChange={(x) => set('quantity', x)}
                      />
                      {dialog.mode === 'import' ? (
                        <>
                          <Field
                            label="Đơn vị nhập"
                            required={false}
                            options={catalog.units}
                            value={item.unitId}
                            onChange={(x) => set('unitId', x)}
                          />
                          <Field
                            label="Đơn giá theo đơn vị nhập"
                            type="number"
                            min="0"
                            value={item.unitPrice}
                            onChange={(x) => set('unitPrice', x)}
                          />
                          {product?.lotTrackingEnabled && (
                            <>
                              <Field
                                label="Mã lô"
                                value={item.lotCode}
                                onChange={(x) => set('lotCode', x)}
                              />
                              <Field
                                label="Ngày sản xuất"
                                required={false}
                                type="date"
                                value={item.manufacturedAt}
                                onChange={(x) => set('manufacturedAt', x)}
                              />
                              <Field
                                label="Hạn dùng"
                                required={product.productType === 'INGREDIENT'}
                                type="date"
                                value={item.expiresAt}
                                onChange={(x) => set('expiresAt', x)}
                              />
                            </>
                          )}
                        </>
                      ) : (
                        product?.lotTrackingEnabled && (
                          <Allocations
                            productId={product.id}
                            quantity={item.quantity}
                            value={item.allocations}
                            onChange={(x) => set('allocations', x)}
                            allowExpired={v.purpose === 'DISPOSAL'}
                          />
                        )
                      )}
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
                    </fieldset>
                  )
                })}
                <button
                  type="button"
                  onClick={() =>
                    change('items', [
                      ...v.items,
                      {
                        productId: '',
                        quantity: 1,
                        unitPrice: 0,
                        allocations: [],
                      },
                    ])
                  }
                >
                  + Thêm hàng
                </button>
                <Field
                  label="Lý do / ghi chú"
                  required={dialog.mode === 'export'}
                  value={v.note}
                  onChange={(x) => change('note', x)}
                />
              </>
            )
          }
        </Dialog>
      )}
    </PageFrame>
  )
}
function LotOpening({ value = [], onChange, expiryRequired }) {
  return (
    <>
      {value.map((lot, index) => (
        <div key={index} className="grid gap-3 rounded border p-3">
          {[
            ['lotCode', 'Mã lô', 'text'],
            ['quantity', 'Số lượng tồn', 'number'],
            ['expiresAt', 'Hạn dùng', 'date'],
            ['manufacturedAt', 'Ngày sản xuất', 'date'],
          ].map(([key, label, type]) => (
            <Field
              key={key}
              label={label}
              type={type}
              required={
                key === 'expiresAt' ? expiryRequired : key !== 'manufacturedAt'
              }
              min={type === 'number' ? 0 : undefined}
              step={type === 'number' ? '0.0001' : undefined}
              value={lot[key]}
              onChange={(x) =>
                onChange(
                  value.map((l, n) => (n === index ? { ...l, [key]: x } : l)),
                )
              }
            />
          ))}
          <button
            type="button"
            onClick={() => onChange(value.filter((_, n) => n !== index))}
          >
            Bỏ lô
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { lotCode: '', quantity: 0 }])}
      >
        + Thêm lô thực tế
      </button>
    </>
  )
}
export function ConsumptionPage() {
  const { branchId, manager } = useAuth(),
    catalog = useCatalog(),
    [query, setQuery] = useState({
      date: today(),
      mealPeriod: 'LUNCH',
      stationId: '',
    }),
    [session, setSession] = useState(null),
    [lines, setLines] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const state = useKitchenData('/kitchen/demand', query)
  return (
    <PageFrame
      title="Nhu cầu và tiêu hao nguyên liệu"
      description="Quản lý nhập lượng thực tế và chọn từng lô để xác nhận xuất kho."
      state={state}
    >
      <div className="grid gap-3 rounded-xl bg-white p-4 sm:grid-cols-3">
        <Field
          label="Ngày"
          type="date"
          value={query.date}
          onChange={(date) => {
            setQuery({ ...query, date })
            setSession(null)
          }}
        />
        <Field
          label="Bữa"
          options={['BREAKFAST', 'LUNCH', 'AFTERNOON', 'DINNER']}
          value={query.mealPeriod}
          onChange={(mealPeriod) => {
            setQuery({ ...query, mealPeriod })
            setSession(null)
          }}
        />
        <Field
          label="Trạm"
          options={catalog.stations}
          value={query.stationId}
          onChange={(stationId) => {
            setQuery({ ...query, stationId })
            setSession(null)
          }}
        />
      </div>
      <Table
        rows={(state.data || []).map((r) => ({ ...r, id: r.productId }))}
        columns={[
          ['productId', 'Nguyên liệu', (r) => catalog.productName(r.productId)],
          ['quantity', 'Nhu cầu'],
          ['availableQuantity', 'Còn hạn'],
          ['shortageQuantity', 'Thiếu'],
        ]}
      />
      {manager && (
        <button
          disabled={busy || !query.stationId}
          className={buttonClass}
          onClick={async () => {
            setBusy(true)
            try {
              const created = await api.create(
                '/kitchen/consumption-sessions',
                { ...query, branchId },
              )
              const data = await api.list(
                `/kitchen/consumption-sessions/${created.id}`,
              )
              setSession(data)
              setLines(
                data.lines.map((l) => ({
                  productId: l.productId,
                  actualQuantity: Number(l.actualQuantity),
                  allocations: [],
                })),
              )
              setError('')
            } catch (e) {
              setError(e.message)
            } finally {
              setBusy(false)
            }
          }}
        >
          Tạo / mở phiên tiêu hao
        </button>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-600">
          {error}
        </p>
      )}
      {session && (
        <form
          className="grid gap-4 rounded-xl bg-white p-5"
          onSubmit={async (e) => {
            e.preventDefault()
            if (busy) return
            setBusy(true)
            try {
              await api.action(
                '/kitchen/consumption-sessions',
                session.id,
                'confirm',
                { lines },
              )
              setSession(null)
              await state.reload()
              setError('')
            } catch (err) {
              setError(
                `${err.message} ${JSON.stringify(err.details?.shortages || '')}`,
              )
            } finally {
              setBusy(false)
            }
          }}
        >
          <h2 className="font-bold">Phiên {session.status}</h2>
          {session.status === 'CONFIRMED' ? (
            <p>Đã xác nhận xuất kho.</p>
          ) : (
            <>
              {lines.map((line, index) => (
                <div className="grid gap-3" key={line.productId}>
                  <Field
                    label={`${catalog.productName(line.productId)} · thực tế theo đơn vị tồn`}
                    type="number"
                    min="0"
                    step="0.0001"
                    value={line.actualQuantity}
                    onChange={(x) =>
                      setLines(
                        lines.map((l, n) =>
                          n === index ? { ...l, actualQuantity: x } : l,
                        ),
                      )
                    }
                  />
                  {catalog.products.find((p) => p.id === line.productId)
                    ?.lotTrackingEnabled &&
                    Number(line.actualQuantity) > 0 && (
                      <Allocations
                        productId={line.productId}
                        quantity={line.actualQuantity}
                        value={line.allocations}
                        onChange={(allocations) =>
                          setLines(
                            lines.map((l, n) =>
                              n === index ? { ...l, allocations } : l,
                            ),
                          )
                        }
                      />
                    )}
                </div>
              ))}
              <button disabled={busy} className={buttonClass}>
                Xác nhận tiêu hao
              </button>
            </>
          )}
        </form>
      )}
    </PageFrame>
  )
}
