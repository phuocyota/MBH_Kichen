import test from 'node:test'
import assert from 'node:assert/strict'
import jsQR from 'jsqr'
import { encodeLabelBarcode, encodeLabelQr, encodePrintLabel, formatLabelDate, PRINTER_DPI } from '../src/page/print/barcodeLabel.js'

test('original CODE128 encoding and label dimensions are preserved', () => {
  const result = encodeLabelBarcode('AB', 50)
  assert.equal(result.bits, '110100100001010001100010001011000111101011101100011101011')
  const moduleDots = result.widthMm * PRINTER_DPI / 25.4 / (result.bits.length + 20)
  assert.ok(Math.abs(moduleDots - Math.round(moduleDots)) < 1e-10)
  assert.ok(moduleDots >= 2)
  assert.ok(result.widthMm <= 46)
  assert.ok(encodeLabelBarcode('MÓN-01').error)
})

test('same selected label can switch formats without stale validation or encoded data', () => {
  const label = { name: 'Cơm gà', code: 'SP001', date: '2026-10-16' }
  assert.equal(encodePrintLabel(label, 'barcode').bits, encodeLabelBarcode(label.code).bits)
  assert.equal(decodePrintedQr(encodePrintLabel(label, 'qr')), 'Tên món: Cơm gà\nMã: SP001\nNgày: 16/10/2026')
  const unicodeLabel = { ...label, code: 'MÓN-01' }
  assert.ok(encodePrintLabel(unicodeLabel, 'barcode').error)
  assert.equal(encodePrintLabel(unicodeLabel, 'qr').error, undefined)
  const longName = { ...label, name: 'Cơm gà '.repeat(100) }
  assert.ok(encodePrintLabel(longName, 'qr').error)
  assert.equal(encodePrintLabel(longName, 'barcode').error, undefined)
})

function decodePrintedQr(result) {
  const dots = Math.round(result.widthMm * PRINTER_DPI / 25.4 / result.size)
  const width = result.size * dots
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255)
  for (const match of result.path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    const col = Number(match[1]) * dots
    const row = Number(match[2]) * dots
    for (let y = row; y < row + dots; y++) {
      for (let x = col; x < col + dots; x++) {
        const offset = (y * width + x) * 4
        pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0
      }
    }
  }
  return jsQR(pixels, width, width)?.data
}

test('printed QR decodes Vietnamese food name, product code and date', () => {
  const result = encodeLabelQr({ name: 'Cơm gà sốt nấm', code: 'SP00001', date: '2026-10-16' })
  assert.equal(result.error, undefined)
  assert.equal(decodePrintedQr(result), 'Tên món: Cơm gà sốt nấm\nMã: SP00001\nNgày: 16/10/2026')
  const moduleDots = result.widthMm * PRINTER_DPI / 25.4 / result.size
  assert.ok(Math.abs(moduleDots - Math.round(moduleDots)) < 1e-10)
  assert.ok(moduleDots >= 2)
  assert.ok(result.widthMm <= 16)
})

test('missing fields and information too dense for the label are rejected', () => {
  const label = { name: 'Cơm gà', code: 'SP001', date: '2026-10-16' }
  for (const field of ['name', 'code', 'date']) {
    assert.ok(encodeLabelQr({ ...label, [field]: '' }).error)
  }
  assert.ok(encodeLabelQr({ ...label, name: 'Cơm gà '.repeat(100) }).error)
})

test('changing the label date changes the date read from QR', () => {
  const label = { name: 'Bún bò', code: 'MÓN-01', date: '2026-10-17' }
  assert.equal(decodePrintedQr(encodeLabelQr(label)), 'Tên món: Bún bò\nMã: MÓN-01\nNgày: 17/10/2026')
})

test('label date does not shift with device timezone', () => {
  assert.equal(formatLabelDate('2026-10-15'), '15/10/2026')
})
