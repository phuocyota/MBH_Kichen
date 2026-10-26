import { useRef, useState } from 'react'
import { uploadImage } from '../../api/kitchenApi'
import FormModal from '../../components/KitchenPlan/FormModal'
export const inputClass =
  'w-full rounded-lg border border-blue-100 bg-white px-3 py-2 text-sm text-slate-900'
export const buttonClass =
  'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40'
export function Field({
  label,
  type = 'text',
  options,
  value,
  onChange,
  required = true,
  multiple = false,
  min,
  step,
  disabled,
  placeholder = 'Chọn…',
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      {options ? (
        <select
          disabled={disabled}
          className={inputClass}
          multiple={multiple}
          required={required}
          value={value ?? (multiple ? [] : '')}
          onChange={(e) =>
            onChange(
              multiple
                ? [...e.target.selectedOptions].map((o) => o.value)
                : e.target.value,
            )
          }
        >
          {!multiple && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.id ?? o} value={o.id ?? o}>
              {o.name ?? o}
            </option>
          ))}
        </select>
      ) : (
        <input
          disabled={disabled}
          className={inputClass}
          type={type}
          required={required}
          min={min}
          step={step}
          value={value ?? ''}
          onChange={(e) =>
            onChange(
              type === 'number'
                ? e.target.value === ''
                  ? ''
                  : Number(e.target.value)
                : e.target.value,
            )
          }
        />
      )}
    </label>
  )
}
export function ImageField({ value, onChange }) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  return (
    <label className="grid gap-2 text-sm">
      Ảnh minh chứng
      <input
        disabled={busy}
        type="file"
        accept="image/*"
        onChange={async (e) => {
          if (!e.target.files[0]) return
          setBusy(true)
          try {
            const data = await uploadImage(e.target.files[0])
            onChange(data.imageUrl)
            setError('')
          } catch (err) {
            setError(err.message)
          } finally {
            setBusy(false)
          }
        }}
      />
      {busy && <span>Đang tải ảnh…</span>}
      {value && (
        <img
          className="h-24 w-24 rounded object-cover"
          src={value}
          alt="Ảnh minh chứng"
        />
      )}
      {error && (
        <span role="alert" className="text-red-600">
          {error}
        </span>
      )}
    </label>
  )
}
export function Filters({ query, setQuery, ranges = false }) {
  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4">
      {ranges ? (
        <>
          <Field
            label="Từ ngày"
            type="date"
            value={query.from}
            onChange={(from) => setQuery({ ...query, from, page: 1 })}
          />
          <Field
            label="Đến ngày"
            type="date"
            value={query.to}
            onChange={(to) => setQuery({ ...query, to, page: 1 })}
          />
        </>
      ) : (
        <Field
          label="Ngày"
          type="date"
          value={query.date}
          onChange={(date) => setQuery({ ...query, date, page: 1 })}
        />
      )}
      <Field
        label="Ca"
        required={false}
        value={query.shift || ''}
        options={['Ca sáng', 'Ca trưa', 'Ca chiều']}
        onChange={(shift) => setQuery({ ...query, shift, page: 1 })}
      />
    </div>
  )
}
export function PageFrame({ title, description, state, children, action }) {
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex gap-2">
          {action}
          <button
            className="rounded-lg border bg-white px-4 py-2"
            disabled={state?.loading}
            onClick={state?.reload}
          >
            Làm mới
          </button>
        </div>
      </div>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {state.error}
        </p>
      )}
      {state?.loading && <p role="status">Đang tải…</p>}
      {children}
    </section>
  )
}
export function Table({ rows, columns, actions }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr>
            {columns.map(([key, label]) => (
              <th key={key} className="px-3 py-3 text-slate-500">
                {label}
              </th>
            ))}
            {actions && <th className="px-3 py-3">Thao tác</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-blue-50">
              {columns.map(([key, , render]) => (
                <td key={key} className="px-3 py-4">
                  {render ? render(row) : String(row[key] ?? '—')}
                </td>
              ))}
              {actions && (
                <td className="flex flex-wrap gap-2 px-3 py-4">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <p className="p-8 text-center text-slate-500">
          Chưa có dữ liệu phù hợp.
        </p>
      )}
    </div>
  )
}
export function Pagination({ data, query, setQuery }) {
  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <span>
        {data?.total || 0} bản ghi · Trang {query.page || 1}
      </span>
      <button
        disabled={(query.page || 1) <= 1}
        onClick={() => setQuery({ ...query, page: query.page - 1 })}
      >
        Trước
      </button>
      <button
        disabled={!data || query.page * query.size >= data.total}
        onClick={() => setQuery({ ...query, page: query.page + 1 })}
      >
        Sau
      </button>
    </div>
  )
}
export function Dialog({ title, onClose, onSubmit, children, initial, submitActions }) {
  const [value, setValue] = useState(initial || {}),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false)
  const requestId = useRef(crypto.randomUUID())
  return (
    <FormModal title={title} onClose={busy ? () => {} : onClose}>
      <form
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault()
          if (busy) return
          setBusy(true)
          try {
            await onSubmit(
              { ...value, requestId: requestId.current },
              e.nativeEvent.submitter?.value || submitActions?.[0]?.value,
            )
            onClose()
          } catch (err) {
            setError(
              err.status === 409
                ? `Dữ liệu xung đột: ${err.message}. Đóng biểu mẫu và tải lại trước khi thử lại.`
                : err.message,
            )
          } finally {
            setBusy(false)
          }
        }}
      >
        {children(value, (key, val) => setValue((v) => ({ ...v, [key]: val })))}
        {error && (
          <div role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button disabled={busy} type="button" onClick={onClose}>
            Đóng
          </button>
          {submitActions ? submitActions.map((action) => (
            <button
              key={action.value}
              type="submit"
              value={action.value}
              disabled={busy}
              className={action.className || buttonClass}
            >
              {busy ? 'Đang xử lý…' : action.label}
            </button>
          )) : (
            <button disabled={busy} className={buttonClass}>
              {' '}
              {busy ? 'Đang gửi…' : 'Lưu'}
            </button>
          )}
        </div>
      </form>
    </FormModal>
  )
}
export function ActionButton({ children, onClick, disabled }) {
  return (
    <button
      disabled={disabled}
      className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 disabled:opacity-40"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
