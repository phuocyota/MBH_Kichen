import { useState } from 'react'
import { api } from '../../api/kitchenApi'
import { useAuth } from '../../auth/authContext'
import { useKitchenChoices, useKitchenData } from '../../hooks/useKitchenData'
import { useCatalog } from './portalHelpers'
import { Allocations } from './MaterialPages'
import {
  ActionButton,
  Dialog,
  Field,
  PageFrame,
  Pagination,
  Table,
  buttonClass,
} from './PortalUI'

export function WarehouseDocuments() {
  const { branchId, manager } = useAuth()
  const catalog = useCatalog()
  const [tab, setTab] = useState('IMPORT')
  const [query, setQuery] = useState({
    page: 1,
    size: 20,
    productType: 'INGREDIENT',
  })
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const voucher = ['IMPORT', 'EXPORT'].includes(tab)
  const resource = voucher
    ? '/stock-vouchers'
    : tab === 'COUNT'
      ? '/stock-takes'
      : '/stock-transfers'
  const state = useKitchenData(resource, {
    ...query,
    receiptType: voucher ? tab : undefined,
  })
  const branches = useKitchenChoices('/branches', {}, manager)
  const names = {
    IMPORT: 'Phiếu nhập',
    EXPORT: 'Phiếu xuất',
    COUNT: 'Kiểm kê',
    TRANSFER: 'Chuyển kho',
  }
  async function complete(row) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await api.action('/stock-takes', row.id, 'complete')
      await state.reload()
      catalog.refreshCatalog()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <PageFrame
      title="Phiếu kho nguyên/nhiên liệu"
      state={state}
      action={
        manager &&
        !voucher && (
          <button
            className={buttonClass}
            onClick={() => setDialog({ mode: tab })}
          >
            Tạo {names[tab].toLowerCase()}
          </button>
        )
      }
    >
      <div className="flex flex-wrap gap-2">
        {Object.entries(names).map(([key, name]) => (
          <button
            key={key}
            className={tab === key ? buttonClass : 'rounded border p-2'}
            onClick={() => {
              setTab(key)
              setQuery((q) => ({ ...q, page: 1 }))
              setError('')
            }}
          >
            {name}
          </button>
        ))}
      </div>
      {voucher && (
        <Field
          label="Loại hàng"
          options={[
            { id: 'INGREDIENT', name: 'Nguyên liệu' },
            { id: 'FUEL', name: 'Nhiên liệu' },
          ]}
          value={query.productType}
          onChange={(productType) =>
            setQuery({ ...query, productType, page: 1 })
          }
        />
      )}
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      <Table
        rows={state.data?.data || []}
        columns={[
          [
            'code',
            'Mã phiếu',
            (r) => r.code || r.importReceipt?.code || r.exportReceipt?.code,
          ],
          [
            'productId',
            'Hàng / nội dung',
            (r) =>
              r.product?.name ||
              r.note ||
              r.items
                ?.map(
                  (i) => i.product?.name || catalog.productName(i.productId),
                )
                .join(', '),
          ],
          [
            'quantity',
            'Số lượng',
            (r) =>
              r.quantity ??
              r.items?.reduce(
                (sum, i) => sum + Number(i.actualQuantity || i.quantity || 0),
                0,
              ),
          ],
          [
            'status',
            'Trạng thái',
            (r) =>
              r.status || r.importReceipt?.status || r.exportReceipt?.status,
          ],
          [
            'createdAt',
            'Ngày lập',
            (r) =>
              new Date(r.createdAt).toLocaleString('vi-VN', {
                timeZone: 'Asia/Bangkok',
              }),
          ],
        ]}
        actions={
          manager && tab === 'COUNT'
            ? (r) =>
                r.status === 'DRAFT' && (
                  <ActionButton disabled={busy} onClick={() => complete(r)}>
                    Xác nhận kiểm kê
                  </ActionButton>
                )
            : undefined
        }
      />
      <Pagination data={state.data} query={query} setQuery={setQuery} />
      {dialog && (
        <Dialog
          title={names[dialog.mode]}
          onClose={() => setDialog(null)}
          initial={{
            quantity: 1,
            actualQuantity: 0,
            allocations: [],
            lotCounts: [],
          }}
          onSubmit={async (v) => {
            if (dialog.mode === 'COUNT')
              await api.create('/stock-takes/drafts', {
                branchId,
                note: v.note,
                items: [
                  {
                    productId: v.productId,
                    actualQuantity: v.actualQuantity,
                    lotCounts: v.lotCounts,
                  },
                ],
              })
            else
              await api.create('/stock-transfers', {
                fromBranchId: branchId,
                toBranchId: v.toBranchId,
                requestId: v.requestId,
                note: v.note,
                items: [
                  {
                    productId: v.productId,
                    quantity: v.quantity,
                    allocations: v.allocations,
                  },
                ],
              })
            await state.reload()
            catalog.refreshCatalog()
          }}
        >
          {(v, change) => (
            <>
              <Field
                label="Hàng"
                options={catalog.products.filter((p) =>
                  ['INGREDIENT', 'FUEL'].includes(p.productType),
                )}
                value={v.productId}
                onChange={(x) => {
                  change('productId', x)
                  change('allocations', [])
                  change('lotCounts', [])
                }}
              />
              {dialog.mode === 'COUNT' ? (
                <>
                  <Field
                    label="Tổng tồn thực tế (đơn vị tồn)"
                    type="number"
                    min="0"
                    step="0.0001"
                    value={v.actualQuantity}
                    onChange={(x) => change('actualQuantity', x)}
                  />
                  {catalog.products.find((p) => p.id === v.productId)
                    ?.lotTrackingEnabled && (
                    <LotCounts
                      productId={v.productId}
                      value={v.lotCounts}
                      onChange={(x) => change('lotCounts', x)}
                    />
                  )}
                  <p>
                    Lưu nháp trước, kiểm tra lại rồi xác nhận trên danh sách.
                    Tồn thay đổi từ lúc lập nháp sẽ yêu cầu kiểm kê lại.
                  </p>
                </>
              ) : (
                <>
                  {branches.error && <p role="alert">{branches.error}</p>}
                  <Field
                    label="Chi nhánh nhận"
                    options={(branches.data || []).filter(
                      (b) => b.id !== branchId,
                    )}
                    value={v.toBranchId}
                    onChange={(x) => change('toBranchId', x)}
                  />
                  <Field
                    label="Số lượng theo đơn vị tồn"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={v.quantity}
                    onChange={(x) => change('quantity', x)}
                  />
                  {catalog.products.find((p) => p.id === v.productId)
                    ?.lotTrackingEnabled && (
                    <Allocations
                      productId={v.productId}
                      quantity={v.quantity}
                      value={v.allocations}
                      onChange={(x) => change('allocations', x)}
                    />
                  )}
                  <p>
                    Chuyển kho hoàn tất ngay khi lưu; giữ nguyên mã lô và hạn
                    dùng.
                  </p>
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

function LotCounts({ productId, value, onChange }) {
  const lots = useKitchenChoices('/stock-lots', { productId })
  return (
    <fieldset className="grid gap-2 rounded border p-3">
      <legend>Kiểm kê tất cả lô, gồm cả lô hết hạn và lô có tồn bằng 0</legend>
      {lots.error && <p role="alert">{lots.error}</p>}
      {(lots.data || []).map((lot) => (
        <Field
          key={lot.id}
          label={`${lot.lotCode} · tồn ${lot.quantity} · hạn ${lot.expiresAt || 'Không áp dụng'}`}
          type="number"
          min="0"
          step="0.0001"
          value={value.find((l) => l.lotId === lot.id)?.actualQuantity ?? ''}
          onChange={(x) =>
            onChange([
              ...value.filter((l) => l.lotId !== lot.id),
              { lotId: lot.id, actualQuantity: x },
            ])
          }
        />
      ))}
      {!lots.data?.length && !lots.error && <p>Chưa có dữ liệu lô.</p>}
    </fieldset>
  )
}
