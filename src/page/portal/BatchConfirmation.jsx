import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Field, buttonClass } from './PortalUI'

function EvidenceStatus({ complete, label }) {
  const Icon = complete ? CheckCircle2 : Circle
  return <span className={`inline-flex items-center gap-2 text-sm font-semibold ${complete ? 'text-emerald-700' : 'text-orange-700'}`}><Icon size={18} />{label}</span>
}

export default function BatchConfirmation({ task, busy, mayAct, onConfirm, onEditActuals }) {
  const [evidence, setEvidence] = useState({})
  const [samples, setSamples] = useState({})
  const [qualityPassed, setQualityPassed] = useState(false)
  const rows = task.confirmations?.length ? task.confirmations : task.received.map((entry) => {
    const dish = task.dishes.find((item) => item.productId === entry.productId)
    return { ...dish, batchId: entry.batchId, name: entry.name, plannedQuantity: dish?.quantity,
      actualQuantity: task.actuals.find((item) => item.batchId === entry.batchId)?.quantity }
  })
  const currentEvidence = (row) => ({ imageUrl: row.actualImageUrl || '', note: row.note || '', ...evidence[row.batchId] })
  const currentSample = (row) => ({ quantity: '', unit: 'g', storageLocation: '', ...samples[row.batchId] })
  const sampleReady = (row) => {
    const sample = currentSample(row)
    return row.hasValidSample || (Number(sample.quantity) > 0 && ['g', 'ml'].includes(sample.unit) && sample.storageLocation.trim().length > 0)
  }
  const ready = rows.length > 0 && rows.every((row) => Number.isSafeInteger(Number(row.actualQuantity)) && Number(row.actualQuantity) > 0 &&
    (!row.requiresImage || currentEvidence(row).imageUrl.trim()) && (!row.requiresSample || sampleReady(row)))
  const disabled = busy || !mayAct
  return (
    <form className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" onSubmit={(event) => {
      event.preventDefault()
      if (!ready || !qualityPassed || disabled) return
      onConfirm({ qualityPassed,
        finishedImages: rows.filter((row) => currentEvidence(row).imageUrl.trim() || currentEvidence(row).note.trim()).map((row) => ({ batchId: row.batchId, ...currentEvidence(row) })),
        samples: rows.filter((row) => row.requiresSample && !row.hasValidSample).map((row) => ({ batchId: row.batchId, ...currentSample(row), quantity: Number(currentSample(row).quantity) })),
      })
    }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl font-bold text-slate-950">Kiểm tra & hoàn thành mẻ</h3>
        <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">Chờ xác nhận</span>
      </div>
      <p className="text-sm text-slate-500">Kiểm tra sản lượng đã ghi nhận, ảnh thành phẩm thực tế và hồ sơ mẫu trước khi hoàn thành. Mẻ trên 30 suất cần lưu mẫu; món được cấu hình bắt buộc lưu mẫu vẫn áp dụng ở số lượng nhỏ.</p>
      {rows.map((row) => {
        const image = currentEvidence(row)
        const sample = currentSample(row)
        const updateImage = (key, value) => setEvidence((previous) => ({ ...previous, [row.batchId]: { imageUrl: row.actualImageUrl || '', note: row.note || '', ...previous[row.batchId], [key]: value } }))
        const updateSample = (key, value) => setSamples((previous) => ({ ...previous, [row.batchId]: { quantity: '', unit: 'g', storageLocation: '', ...previous[row.batchId], [key]: value } }))
        return (
          <fieldset disabled={disabled} key={row.batchId} className="space-y-4 rounded-2xl border border-slate-200 p-4 sm:p-5">
            <legend className="px-1 text-lg font-bold">{row.name}</legend>
            <p className="break-all text-xs text-slate-500">Mẻ {row.batchId} · {task.date} · {task.shift}</p>
            <p className="text-sm text-slate-600">Dự kiến: {Number(row.plannedQuantity).toLocaleString('vi-VN')} suất</p>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">
              Số suất chế biến thực tế
              <input type="number" readOnly value={row.actualQuantity ?? ''} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg" />
            </label>
            <button type="button" disabled={disabled} onClick={onEditActuals} className="text-sm font-semibold text-blue-700 underline">Chỉnh sản lượng, ảnh và nguyên liệu tại Ghi nhận thực tế</button>
            <section className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold">Hình ảnh thành phẩm {row.requiresImage ? '· Bắt buộc' : '· Không bắt buộc'}</h4>
                <EvidenceStatus complete={Boolean(image.imageUrl)} label={image.imageUrl ? 'Đã ghi nhận ảnh' : 'Chưa có ảnh'} />
              </div>
              {image.imageUrl ? <img src={image.imageUrl} alt={`Ảnh thành phẩm thực tế · ${row.name}`} className="max-h-64 w-full rounded-xl bg-slate-50 object-contain" /> : <p className="text-sm text-orange-700">Chưa có ảnh đã lưu. Quay lại Ghi nhận thực tế để chụp hoặc tải ảnh.</p>}
              <p className="text-xs text-slate-500">Ảnh thành phẩm đã được lưu tại bước Ghi nhận thực tế; bước này kiểm tra lại ảnh và bổ sung hồ sơ lưu mẫu.</p>
            </section>
            <section className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold">Hồ sơ lưu mẫu</h4>
                <EvidenceStatus complete={!row.requiresSample || sampleReady(row)} label={!row.requiresSample ? 'Không bắt buộc với mẻ này' : row.hasValidSample ? 'Đã có mẫu hợp lệ' : sampleReady(row) ? 'Đủ thông tin để ghi nhận mẫu' : 'Chưa hoàn tất'} />
              </div>
              {row.requiresSample && !row.hasValidSample && <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={`Lượng mẫu · ${row.name}`} type="number" min="0.0001" step="0.0001" value={sample.quantity} onChange={(value) => updateSample('quantity', value)} />
                  <Field label={`Đơn vị mẫu · ${row.name}`} options={['g', 'ml']} value={sample.unit} onChange={(value) => updateSample('unit', value)} />
                </div>
                <Field label={`Vị trí lưu mẫu · ${row.name}`} value={sample.storageLocation} onChange={(value) => updateSample('storageLocation', value)} />
                <p className="text-xs text-slate-500">Hệ thống ghi thời điểm lấy mẫu và người xác nhận khi lưu hồ sơ thành công.</p>
              </>}
            </section>
            <label className="grid gap-2 text-sm font-semibold text-slate-700">Ghi chú chế biến
              <textarea rows={3} maxLength={2000} value={image.note} onChange={(event) => updateImage('note', event.target.value)} placeholder="Ghi nhận sai lệch, hao hụt hoặc vấn đề phát sinh…" className="w-full rounded-xl border border-slate-200 p-3 font-normal" />
            </label>
          </fieldset>
        )
      })}
      <label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" required checked={qualityPassed} disabled={disabled} onChange={(event) => setQualityPassed(event.target.checked)} />Xác nhận thành phẩm đạt yêu cầu</label>
      {!ready && <p role="status" className="text-sm text-orange-700">Cần đủ sản lượng, ảnh thực tế và hồ sơ lưu mẫu bắt buộc trước khi xác nhận.</p>}
      <button className={`${buttonClass} min-h-12 w-full text-base`} disabled={disabled || !ready || !qualityPassed}>{busy ? 'Đang xác nhận…' : 'Xác nhận hoàn thành mẻ'}</button>
    </form>
  )
}
