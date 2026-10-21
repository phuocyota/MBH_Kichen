import { useState } from 'react'
import { api } from '../../api/kitchenApi'
import { useAuth } from '../../auth/authContext'
import { useCatalog, today } from './portalHelpers'
import { useKitchenData, useKitchenChoices } from '../../hooks/useKitchenData'
import {
  ActionButton,
  Dialog,
  Field,
  PageFrame,
  Pagination,
  Table,
  buttonClass,
} from './PortalUI'

const resources = {
  products: '/products',
  stations: '/kitchen/stations',
  recipes: '/kitchen/recipes',
  periods: '/kitchen/service-periods',
  assignments: '/kitchen/assignments',
  boardingMenu: '/meal-items',
}
const names = {
  products: 'Danh mục hàng',
  stations: 'Trạm bếp',
  recipes: 'Công thức',
  periods: 'Khung phục vụ',
  assignments: 'Phân công',
  boardingMenu: 'Thực đơn bán trú',
}
export function ConfigurationPage() {
  const { branchId, manager, session } = useAuth(),
    [tab, setTab] = useState('products'),
    [dialog, setDialog] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const catalog = useCatalog(
    manager
      ? [
          ...(['recipes', 'boardingMenu'].includes(tab) ||
          dialog?.mode === 'mapping'
            ? ['products']
            : []),
          ...(dialog && ['products', 'recipes'].includes(tab) ? ['units'] : []),
          ...(dialog && tab === 'products' ? ['categories'] : []),
          ...(dialog && tab === 'assignments' ? ['stations'] : []),
        ]
      : [],
  )
  const [query, setQuery] = useState({ page: 1, size: 30 })
  const state = useKitchenData(
      resources[tab],
      { ...query, date: today() },
      manager,
    ),
    employees = useKitchenChoices(
      '/employees',
      {},
      manager && tab === 'assignments' && Boolean(dialog),
    )
  if (!manager)
    return <p role="alert">Chỉ quản lý được cấu hình hệ thống bếp.</p>
  async function activate(r) {
    setBusy(true)
    try {
      await api.action('/kitchen/recipes', r.id, 'activate')
      state.reload()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }
  const rows = Array.isArray(state.data) ? state.data : state.data?.data || []
  return (
    <PageFrame
      title="Cấu hình bếp"
      state={state}
      action={
        <button
          className={buttonClass}
          onClick={() => setDialog({ mode: 'create' })}
        >
          Thêm {names[tab].toLowerCase()}
        </button>
      }
    >
      <div className="flex flex-wrap gap-2">
        {Object.keys(resources).map((t) => (
          <button
            className={
              tab === t ? buttonClass : 'rounded-lg border bg-white px-4 py-2'
            }
            key={t}
            onClick={() => {
              setTab(t)
              setDialog(null)
              setError('')
            }}
          >
            {names[t]}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {!Array.isArray(state.data) && (
        <Pagination data={state.data} query={query} setQuery={setQuery} />
      )}
      <Table
        rows={rows}
        columns={[
          [
            'name',
            'Nội dung',
            (r) =>
              r.name ||
              (r.productId
                ? catalog.productName(r.productId)
                : r.mealPeriod || r.employee?.fullName || r.employeeId),
          ],
          [
            'code',
            'Loại / mã',
            (r) =>
              tab === 'products'
                ? r.productType || 'Chưa phân loại'
                : r.code || r.workDate || r.version,
          ],
          [
            'status',
            'Trạng thái',
            (r) => r.status || (r.isActive === false ? 'Ngừng' : 'Hoạt động'),
          ],
        ]}
        actions={(r) => (
          <>
            {['products', 'stations', 'boardingMenu'].includes(tab) &&
              (tab !== 'products' ||
                !r.branchId ||
                r.branchId === branchId ||
                session?.userType === 'ADMIN') && (
                <ActionButton
                  onClick={() => setDialog({ mode: 'edit', row: r })}
                >
                  Sửa
                </ActionButton>
              )}
            {tab === 'recipes' && r.status === 'DRAFT' && (
              <ActionButton disabled={busy} onClick={() => activate(r)}>
                Kích hoạt phiên bản
              </ActionButton>
            )}
            {tab === 'stations' && (
              <ActionButton
                onClick={() => setDialog({ mode: 'mapping', row: r })}
              >
                Gán món
              </ActionButton>
            )}
          </>
        )}
      />
      {dialog && (
        <Dialog
          title={names[tab]}
          onClose={() => setDialog(null)}
          initial={{
            productType: 'INGREDIENT',
            categoryId: '',
            baseUnitId: '',
            price: 0,
            costPrice: 0,
            cookDuration: 30,
            recommendedUseMinutes: 120,
            requiresSample: false,
            mealPeriod: 'LUNCH',
            dateKey: today(),
            yieldQuantity: 1,
            workDate: today(),
            shift: 'Ca trưa',
            items: [],
            ...(dialog.row || {}),
          }}
          onSubmit={async (v) => {
            const dto = { ...v, branchId }
            if (tab === 'products' && dialog.mode === 'edit')
              dto.branchId = dialog.row.branchId || branchId
            if (tab === 'products' && dto.productType === '')
              dto.productType = null
            if (tab === 'products' && !dto.baseUnitId) delete dto.baseUnitId
            if (tab === 'products')
              dto.isCanteenItem =
                v.isCanteenItem ??
                !['INGREDIENT', 'FUEL'].includes(v.productType)
            delete dto.requestId
            if (dialog.mode === 'mapping')
              await api.update(
                '/kitchen/stations',
                `${dialog.row.id}/products/${v.productId}`,
                {},
              )
            else if (tab === 'periods')
              await api.update('/kitchen/service-periods', '', {
                ...dto,
                timezone: 'Asia/Bangkok',
              })
            else if (dialog.mode === 'edit') {
              delete dto.quantity
              delete dto.lotTrackingEnabled
              await api.update(resources[tab], dialog.row.id, dto)
            } else await api.create(resources[tab], dto)
            catalog.refreshCatalog()
            await state.reload()
          }}
        >
          {(v, change) =>
            dialog.mode === 'mapping' ? (
              <Field
                label="Món"
                options={catalog.products.filter(
                  (p) => p.productType === 'FINISHED_GOOD',
                )}
                value={v.productId}
                onChange={(x) => change('productId', x)}
              />
            ) : (
              <>
                {tab === 'products' && (
                  <>
                    <Field
                      label="Tên hàng"
                      value={v.name}
                      onChange={(x) => change('name', x)}
                    />
                    <Field
                      label="Loại hàng"
                      required={dialog.mode === 'create'}
                      options={[
                        { id: 'INGREDIENT', name: 'Nguyên liệu' },
                        { id: 'FUEL', name: 'Nhiên liệu' },
                        { id: 'FINISHED_GOOD', name: 'Món thành phẩm' },
                        { id: 'MERCHANDISE', name: 'Hàng bán trực tiếp' },
                      ]}
                      value={v.productType}
                      onChange={(x) => change('productType', x)}
                    />
                    <Field
                      label="Nhóm hàng"
                      options={catalog.categories}
                      value={v.categoryId}
                      onChange={(x) => change('categoryId', x)}
                    />
                    <Field
                      label="Đơn vị tồn chuẩn"
                      required={['INGREDIENT', 'FUEL'].includes(v.productType)}
                      options={catalog.units}
                      value={v.baseUnitId}
                      onChange={(x) => change('baseUnitId', x)}
                    />
                    <Field
                      label="Tên đơn vị phục vụ"
                      value={v.unit}
                      onChange={(x) => change('unit', x)}
                    />
                    <Field
                      label="Giá bán"
                      type="number"
                      min="0"
                      value={v.price}
                      onChange={(x) => change('price', x)}
                    />
                    <Field
                      label="Giá vốn"
                      type="number"
                      min="0"
                      value={v.costPrice}
                      onChange={(x) => change('costPrice', x)}
                    />
                    {v.productType === 'FINISHED_GOOD' && (
                      <>
                        <label>
                          <input
                            type="checkbox"
                            checked={v.requiresSample}
                            onChange={(e) =>
                              change('requiresSample', e.target.checked)
                            }
                          />{' '}
                          Bắt buộc lấy mẫu
                        </label>
                        <Field
                          label="Thời gian chế biến (phút)"
                          type="number"
                          min="1"
                          value={v.cookDuration}
                          onChange={(x) => change('cookDuration', x)}
                        />
                        <Field
                          label="Thời gian sử dụng sau sẵn sàng (phút)"
                          type="number"
                          min="1"
                          value={v.recommendedUseMinutes}
                          onChange={(x) => change('recommendedUseMinutes', x)}
                        />
                      </>
                    )}
                    <label>
                      <input
                        type="checkbox"
                        checked={
                          v.isCanteenItem ??
                          !['INGREDIENT', 'FUEL'].includes(v.productType)
                        }
                        onChange={(e) =>
                          change('isCanteenItem', e.target.checked)
                        }
                      />{' '}
                      Cho phép bán ở căn tin
                    </label>
                  </>
                )}
                {tab === 'stations' && (
                  <>
                    <Field
                      label="Mã trạm"
                      value={v.code}
                      onChange={(x) => change('code', x)}
                    />
                    <Field
                      label="Tên trạm"
                      value={v.name}
                      onChange={(x) => change('name', x)}
                    />
                  </>
                )}
                {['recipes', 'boardingMenu'].includes(tab) && (
                  <Field
                    label="Món thành phẩm"
                    options={catalog.products.filter(
                      (p) => p.productType === 'FINISHED_GOOD',
                    )}
                    value={v.productId}
                    onChange={(x) => change('productId', x)}
                  />
                )}
                {tab === 'recipes' && (
                  <>
                    <Field
                      label="Sản lượng công thức"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={v.yieldQuantity}
                      onChange={(x) => change('yieldQuantity', x)}
                    />
                    <Field
                      label="Đơn vị sản lượng"
                      options={catalog.units}
                      value={v.yieldUnitId}
                      onChange={(x) => change('yieldUnitId', x)}
                    />
                    {v.items.map((line, index) => (
                      <fieldset
                        className="grid gap-2 rounded border p-3"
                        key={index}
                      >
                        <Field
                          label="Nguyên liệu"
                          options={catalog.products.filter(
                            (p) => p.productType === 'INGREDIENT',
                          )}
                          value={line.ingredientProductId}
                          onChange={(x) =>
                            change(
                              'items',
                              v.items.map((i, n) =>
                                n === index
                                  ? { ...i, ingredientProductId: x }
                                  : i,
                              ),
                            )
                          }
                        />
                        <Field
                          label="Định lượng"
                          type="number"
                          min="0.0001"
                          step="0.0001"
                          value={line.quantity}
                          onChange={(x) =>
                            change(
                              'items',
                              v.items.map((i, n) =>
                                n === index ? { ...i, quantity: x } : i,
                              ),
                            )
                          }
                        />
                        <Field
                          label="Đơn vị"
                          options={catalog.units}
                          value={line.unitId}
                          onChange={(x) =>
                            change(
                              'items',
                              v.items.map((i, n) =>
                                n === index ? { ...i, unitId: x } : i,
                              ),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            change(
                              'items',
                              v.items.filter((_, n) => n !== index),
                            )
                          }
                        >
                          Bỏ nguyên liệu
                        </button>
                      </fieldset>
                    ))}
                    <button
                      type="button"
                      onClick={() => change('items', [...v.items, {}])}
                    >
                      + Nguyên liệu
                    </button>
                  </>
                )}
                {['periods', 'boardingMenu'].includes(tab) && (
                  <Field
                    label="Bữa"
                    options={['BREAKFAST', 'LUNCH', 'AFTERNOON', 'DINNER']}
                    value={v.mealPeriod}
                    onChange={(x) => change('mealPeriod', x)}
                  />
                )}
                {tab === 'periods' && (
                  <>
                    {[
                      ['startTime', 'Bắt đầu'],
                      ['endTime', 'Kết thúc'],
                      ['cutoffTime', 'Giờ chốt'],
                    ].map(([key, label]) => (
                      <Field
                        key={key}
                        label={label}
                        type="time"
                        value={v[key]}
                        onChange={(x) => change(key, x)}
                      />
                    ))}
                  </>
                )}
                {tab === 'boardingMenu' && (
                  <>
                    <Field
                      label="Ngày áp dụng"
                      type="date"
                      value={v.dateKey}
                      onChange={(x) => change('dateKey', x)}
                    />
                    <Field
                      label="Số suất dự kiến"
                      type="number"
                      min="0"
                      value={v.expectedQuantity}
                      onChange={(x) => change('expectedQuantity', x)}
                    />
                  </>
                )}
                {tab === 'assignments' && (
                  <>
                    <Field
                      label="Nhân viên"
                      options={(employees.data || []).map((e) => ({
                        id: e.id,
                        name: e.fullName || e.name || e.code,
                      }))}
                      value={v.employeeId}
                      onChange={(x) => change('employeeId', x)}
                    />
                    <Field
                      label="Trạm"
                      options={catalog.stations}
                      value={v.stationId}
                      onChange={(x) => change('stationId', x)}
                    />
                    <Field
                      label="Ngày làm"
                      type="date"
                      value={v.workDate}
                      onChange={(x) => change('workDate', x)}
                    />
                    <Field
                      label="Ca"
                      options={['Ca sáng', 'Ca trưa', 'Ca chiều']}
                      value={v.shift}
                      onChange={(x) => change('shift', x)}
                    />
                  </>
                )}
                <Field
                  label={tab === 'recipes' ? 'Mô tả thành phần (tối đa 500 ký tự)' : 'Ghi chú'}
                  required={false}
                  value={tab === 'recipes' ? v.description : v.note || v.description}
                  onChange={(x) =>
                    change(['stations', 'recipes'].includes(tab) ? 'description' : 'note', x)
                  }
                />
              </>
            )
          }
        </Dialog>
      )}
    </PageFrame>
  )
}
