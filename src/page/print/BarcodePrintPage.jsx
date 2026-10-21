import { useRef, useState } from 'react'
import { Barcode, QrCode, Plus, Printer, Trash2 } from 'lucide-react'
import { useCatalog, today } from '../portal/portalHelpers'
import { buttonClass, inputClass } from '../portal/PortalUI'
import { encodePrintLabel, formatLabelDate } from './barcodeLabel'
import { printBarcodeLabels } from './printBarcodeLabels'
import './barcodePrint.css'

function Label({ name, code, date, symbol, format }) {
  if (format === 'barcode') {
    return (
      <article className="barcode-label barcode-label-linear">
        <div className="barcode-label-name" title={name}>{name}</div>
        <svg role="img" aria-label={`Mã vạch ${code}`} viewBox={`0 0 ${symbol.bits.length + 20} 80`} preserveAspectRatio="none" style={{ width: `${symbol.widthMm}mm` }}>
          <rect width="100%" height="100%" fill="white" />
          {Array.from(symbol.bits, (bit, index) => bit === '1' ? (
            <rect key={index} x={index + 10} y="0" width="1" height="80" fill="black" />
          ) : null)}
        </svg>
        <div className="barcode-label-code">{code}</div>
        <div className="barcode-label-date">Ngày: {formatLabelDate(date)}</div>
      </article>
    )
  }
  const qr = symbol
  return (
    <article className="barcode-label">
      <div className="barcode-label-name" title={name}>{name}</div>
      <div className="qr-label-body">
        <svg
          role="img"
          aria-label={'Mã QR: ' + qr.text}
          viewBox={'0 0 ' + qr.size + ' ' + qr.size}
          style={{ width: qr.widthMm + 'mm', height: qr.widthMm + 'mm' }}
        >
          <rect width="100%" height="100%" fill="white" />
          <path d={qr.path} fill="black" />
        </svg>
        <div className="qr-label-info">
          <div className="barcode-label-code" title={code}>{code}</div>
          <div className="barcode-label-date">Ngày:<br />{formatLabelDate(date)}</div>
        </div>
      </div>
    </article>
  )
}

function LabelRows({ labels, format }) {
  return (
    <div className="barcode-label-list">
      {labels.filter((_, index) => index % 2 === 0).map((label, index) => (
        <div className="barcode-label-row" key={label.code}>
          <Label {...label} format={format} />
          {labels[index * 2 + 1] && <Label {...labels[index * 2 + 1]} format={format} />}
        </div>
      ))}
    </div>
  )
}

export default function BarcodePrintPage() {
  const { products } = useCatalog()
  const [format, setFormat] = useState('barcode')
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [date, setDate] = useState(today)
  const [labels, setLabels] = useState([])
  const [error, setError] = useState('')
  const [printError, setPrintError] = useState('')
  const [isPrinting, setIsPrinting] = useState(false)
  const previewRef = useRef(null)
  const symbol = encodePrintLabel({ name, code, date }, format)
  const ready = name.trim() && date && !symbol.error
  const preparedLabels = labels.map((label) => ({ ...label, symbol: encodePrintLabel(label, format) }))
  const canPrint = preparedLabels.length > 0 && preparedLabels.every((label) => label.date && !label.symbol.error)
  const catalogLabels = products.map((product) => {
    const code = String(product.barcode || product.code || '').trim()
    return {
      productId: String(product.id), name: product.name || '', code,
      symbol: encodePrintLabel({ name: product.name || '', code, date }, format),
    }
  })
  const visibleProducts = catalogLabels.filter((product) =>
    `${product.name} ${product.code}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')),
  )

  function isSelected(product) {
    return labels.some((label) => label.productId === product.productId || label.code === product.code)
  }

  function toggleProduct(product, checked) {
    setLabels((current) => checked
      ? [...current, { ...product, date }]
      : current.filter((label) => label.productId !== product.productId && label.code !== product.code))
    setError('')
  }

  function selectAllProducts() {
    setLabels((current) => {
      const next = [...current]
      for (const product of visibleProducts) {
        if (product.name && !product.symbol.error &&
          !next.some((label) => label.productId === product.productId || label.code === product.code)) {
          next.push({ ...product, date })
        }
      }
      return next
    })
  }

  function addLabel(event) {
    event.preventDefault()
    if (!ready) return
    if (labels.some((label) => label.code === code.trim())) {
      setError('Sản phẩm hoặc mã này đã có trong danh sách. Mỗi sản phẩm chỉ in một tem.')
      return
    }
    setLabels((current) => [...current, {
      name: name.trim(), code: code.trim(), date,
    }])
    setName('')
    setCode('')
    setError('')
  }

  async function printLabels() {
    if (!canPrint || isPrinting) return
    setPrintError('')
    setIsPrinting(true)
    try {
      await printBarcodeLabels(previewRef.current?.querySelector('.barcode-label-list'))
    } catch (error) {
      setPrintError(error.message || 'Không thể mở bản in. Vui lòng thử lại.')
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-950">
          <Printer className="text-blue-600" aria-hidden="true" /> In tem mã vạch / mã QR
        </h1>
        <p className="mt-1 text-sm text-slate-500">Tích chọn nhiều sản phẩm để đưa vào danh sách in. Mỗi sản phẩm một tem, hai tem trên mỗi hàng 70 × 22 mm.</p>
      </div>
      <div role="group" aria-label="Chọn loại tem in" className="flex flex-wrap gap-3">
        {[
          { value: 'barcode', label: 'In tem mã vạch', Icon: Barcode },
          { value: 'qr', label: 'In mã QR', Icon: QrCode },
        ].map(({ value, label, Icon }) => (
          <button key={value} type="button" aria-pressed={format === value} disabled={isPrinting} onClick={() => {
            setFormat(value)
            setError('')
            setPrintError('')
          }} className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold ${format === value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700'}`}>
            <Icon size={18} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-2">
        <div className="min-w-0 space-y-4 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Chọn sản phẩm để in</h2>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Ngày tháng
            <input className={inputClass} type="date" required value={date} onChange={(event) => {
              const nextDate = event.target.value
              setDate(nextDate)
              setLabels((current) => current.map((label) => ({ ...label, date: nextDate })))
            }} />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Tìm sản phẩm
            <input className={inputClass} type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhập tên hoặc mã sản phẩm" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" disabled={!date || !visibleProducts.some((product) => product.name && !product.symbol.error && !isSelected(product))} onClick={selectAllProducts} className={buttonClass}>Chọn tất cả kết quả</button>
            <button type="button" disabled={!labels.length} onClick={() => setLabels([])} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40">Bỏ chọn tất cả</button>
          </div>
          <p className="text-sm text-slate-500" aria-live="polite">Đã chọn {labels.length} sản phẩm. Tích chọn là thêm ngay vào danh sách in.</p>
          <div className="max-h-80 overflow-y-auto rounded-lg border border-blue-100">
            {visibleProducts.map((product) => (
              <label key={product.productId} className="flex cursor-pointer items-start gap-3 border-b border-blue-50 p-3 last:border-b-0 hover:bg-blue-50">
                <input type="checkbox" className="mt-1 size-4 shrink-0 accent-blue-600" aria-label={`Chọn ${product.name}`} checked={isSelected(product)} disabled={!isSelected(product) && (!product.name || Boolean(product.symbol.error) || !date)} onChange={(event) => toggleProduct(product, event.target.checked)} />
                <span className="min-w-0">
                  <span className="block break-words text-sm font-semibold text-slate-900">{product.name}</span>
                  <span className="block break-all text-xs text-slate-500">{product.code || 'Chưa có mã sản phẩm'}</span>
                  {product.symbol.error && <span className="block text-xs text-red-600">{product.symbol.error}</span>}
                </span>
              </label>
            ))}
            {!visibleProducts.length && <p className="p-4 text-sm text-slate-500">{products.length ? 'Không tìm thấy sản phẩm.' : 'Danh mục chưa có sản phẩm. Bạn có thể nhập tem thủ công bên dưới.'}</p>}
          </div>
          <details className="border-t border-blue-100 pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-blue-700">Nhập tem thủ công</summary>
            <form onSubmit={addLabel} onChange={() => setError('')} className="mt-4 space-y-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Tên sản phẩm
                <input className={inputClass} required maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="Ví dụ: Cơm gà" />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Mã sản phẩm
                <input className={inputClass} required maxLength={80} value={code} onChange={(event) => setCode(event.target.value)} placeholder="Ví dụ: SP00001" aria-describedby="barcode-hint" />
              </label>
              <p id="barcode-hint" className="text-xs text-slate-500">{format === 'qr' ? 'Quét QR để xem tên món ăn, mã sản phẩm và ngày trên tem, không cần mạng.' : 'Mã vạch dùng mã sản phẩm gồm chữ không dấu, số và ký hiệu ASCII.'}</p>
              {code && symbol.error && <p role="alert" className="text-sm text-red-600">{symbol.error}</p>}
              {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={!ready} className={`${buttonClass} inline-flex items-center gap-2`}>
                <Plus size={18} aria-hidden="true" /> Thêm vào danh sách
              </button>
            </form>
          </details>
        </div>
        <div className="min-w-0 space-y-4 rounded-xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold text-slate-900">Danh sách in ({labels.length} sản phẩm)</h2>
            <button type="button" disabled={!canPrint || isPrinting} onClick={printLabels} className={`${buttonClass} inline-flex items-center gap-2`}>
              <Printer size={18} aria-hidden="true" /> {isPrinting ? 'Đang mở bản in…' : `In ${labels.length} ${format === 'qr' ? 'mã QR' : 'tem mã vạch'}`}
            </button>
          </div>
          {preparedLabels.filter((label) => label.symbol.error).map((label) => (
            <p key={label.code} role="alert" className="text-sm text-red-600">{label.name}: {label.symbol.error}</p>
          ))}
          {printError && <p role="alert" className="text-sm text-red-600">{printError}</p>}
          {labels.length > 0 && (
            <ul className="divide-y divide-blue-100">
              {labels.map((label) => (
                <li key={label.code} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-slate-900">{label.name}</p>
                    <p className="break-all text-xs text-slate-500">{label.code} · {label.date ? formatLabelDate(label.date) : 'Chưa chọn ngày'} · 1 tem</p>
                  </div>
                  <button type="button" aria-label={`Xóa ${label.name}`} className="shrink-0 rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => setLabels((current) => current.filter((item) => item.code !== label.code))}>
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <h3 className="text-sm font-semibold text-slate-700">Xem trước {format === 'qr' ? 'tem mã QR' : 'tem mã vạch'}</h3>
          <div ref={previewRef} className="overflow-x-auto rounded-lg border border-dashed border-slate-300 bg-slate-100 p-5">
            {canPrint ? (
              <LabelRows labels={preparedLabels} format={format} />
            ) : <p className="py-12 text-center text-sm text-slate-500">Thêm sản phẩm vào danh sách để xem trước và in tem.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}
