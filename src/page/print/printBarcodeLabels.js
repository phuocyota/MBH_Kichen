import labelStyles from './barcodePrint.css?inline'

// Print only the label document. App layout, portals and global print rules
// must not contribute boxes or page transitions to the printer's page count.
export async function printBarcodeLabels(labelList) {
  if (!labelList) throw new Error('Không tìm thấy nội dung tem để in.')
  document.getElementById('barcode-print-frame')?.remove()
  const frame = document.createElement('iframe')
  frame.id = 'barcode-print-frame'
  frame.title = 'Bản in tem 70 × 22 mm'
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;left:0;top:0;width:70mm;height:22mm;border:0;opacity:0;pointer-events:none;'
  try {
    const loaded = new Promise((resolve) => { frame.onload = resolve })
    frame.srcdoc = '<!doctype html><html lang="vi"><head><meta charset="UTF-8"><title>In tem</title></head><body></body></html>'
    document.body.appendChild(frame)
    await loaded
    const printDocument = frame.contentDocument
    const printWindow = frame.contentWindow
    if (!printDocument || !printWindow) throw new Error('Không thể mở bản in tem.')
    const style = printDocument.createElement('style')
    style.textContent = `${labelStyles}
      @page { size: 70mm 22mm; margin: 0; }
      html, body { margin: 0; padding: 0; min-width: 0; min-height: 0; height: auto; }
      body { line-height: 0; background: #fff; }
      .barcode-label-list { display: block; gap: 0; margin: 0; padding: 0; }
      .barcode-label-row { height: auto; break-inside: avoid; break-after: auto; }
      .barcode-label-row + .barcode-label-row { break-before: page; }
      .barcode-label { break-inside: avoid; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    `
    printDocument.head.appendChild(style)
    printDocument.body.appendChild(labelList.cloneNode(true))
    await printDocument.fonts.ready
    await new Promise((resolve) => printWindow.requestAnimationFrame(resolve))
    printWindow.addEventListener('afterprint', () => frame.remove(), { once: true })
    printWindow.focus()
    printWindow.print()
  } catch (error) {
    frame.remove()
    throw error
  }
}
