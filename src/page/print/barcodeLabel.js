import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'

export const PRINTER_DPI = 203
const QUIET_ZONE = 4

// Preserve the original CODE128 label encoding and printed dimensions.
export function encodeLabelBarcode(value, labelWidth) {
  if (!value || !/^[\x20-\x7E]+$/.test(value)) {
    return { error: 'Nhập mã vạch gồm chữ không dấu, số hoặc ký hiệu ASCII.' }
  }
  if (labelWidth !== undefined && (!Number.isFinite(labelWidth) || labelWidth < 30 || labelWidth > 76)) {
    return { error: 'Chiều rộng tem phải từ 30 đến 76 mm.' }
  }
  try {
    const result = {}
    JsBarcode(result, value, { format: 'CODE128', displayValue: false })
    const bits = result.encodings.map((encoding) => encoding.data).join('')
    const moduleDots = labelWidth === undefined ? 2 :
      Math.floor(((labelWidth - 4) * PRINTER_DPI / 25.4) / (bits.length + 20))
    if (moduleDots < 2) {
      return { error: 'Mã quá dài cho khổ tem này. Hãy rút ngắn mã hoặc tăng chiều rộng tem.' }
    }
    return { bits, widthMm: (bits.length + 20) * moduleDots * 25.4 / PRINTER_DPI }
  } catch {
    return { error: 'Mã vạch không hợp lệ. Vui lòng kiểm tra lại.' }
  }
}

export function encodePrintLabel(label, format) {
  return format === 'qr' ? encodeLabelQr(label) : encodeLabelBarcode(label.code.trim())
}

export function formatLabelDate(value) {
  const [year, month, day] = value.split('-')
  return day + '/' + month + '/' + year
}

export function encodeLabelQr({ name, code, date }) {
  if (!name?.trim() || !code?.trim() || !date) {
    return { error: 'Nhập đầy đủ tên món ăn, mã sản phẩm và ngày.' }
  }
  const text = 'Tên món: ' + name.trim() + '\nMã: ' + code.trim() + '\nNgày: ' + formatLabelDate(date)
  try {
    const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' })
    const size = modules.size + QUIET_ZONE * 2
    // Reserve a quiet zone and at least two whole printer dots per module.
    const moduleDots = Math.floor(16 * PRINTER_DPI / 25.4 / size)
    if (moduleDots < 2) {
      return { error: 'Thông tin quá dài cho QR trên tem 35 × 22 mm. Hãy rút ngắn tên hoặc mã sản phẩm.' }
    }
    const paths = []
    for (let row = 0; row < modules.size; row++) {
      for (let col = 0; col < modules.size; col++) {
        if (modules.get(row, col)) paths.push('M' + (col + QUIET_ZONE) + ' ' + (row + QUIET_ZONE) + 'h1v1h-1z')
      }
    }
    return { text, size, path: paths.join(''), widthMm: size * moduleDots * 25.4 / PRINTER_DPI }
  } catch {
    return { error: 'Không thể tạo mã QR. Hãy kiểm tra lại thông tin.' }
  }
}
