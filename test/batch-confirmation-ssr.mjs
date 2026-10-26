import assert from 'node:assert/strict'
import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Render the real JSX and exercise the real Axios upload interceptors, without a browser or API server.
const server = await createServer({ configFile: false, server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom' })
try {
  const { default: BatchConfirmation } = await server.ssrLoadModule('/src/page/portal/BatchConfirmation.jsx')
  const task = { date: '2026-10-26', shift: 'Ca trưa', confirmations: [{ batchId: 'batch-1', name: 'Thịt kho', plannedQuantity: 300,
    actualQuantity: 31, requiresImage: true, requiresSample: true, hasValidSample: false, actualImageUrl: '', note: '' }] }
  const render = (row = {}) => renderToStaticMarkup(React.createElement(BatchConfirmation, {
    task: { ...task, confirmations: [{ ...task.confirmations[0], ...row }] }, busy: false, mayAct: true,
    onConfirm() {}, onEditActuals() {},
  }))
  const missing = render()
  assert.ok(missing.includes('Kiểm tra &amp; hoàn thành mẻ'))
  assert.ok(!missing.includes('capture="environment"'), 'QC only reviews the recorded photo')
  assert.ok(!missing.includes('type="file"'), 'QC must not upload finished photos')
  assert.ok(missing.includes('Chưa hoàn tất'))
  assert.ok(missing.includes('Lượng mẫu'))
  assert.match(missing, /<button[^>]+disabled=""[^>]*>Xác nhận hoàn thành mẻ/)
  const small = render({ actualQuantity: 30, requiresSample: false, actualImageUrl: 'https://example.test/finished.jpg' })
  assert.ok(small.includes('Đã ghi nhận ảnh'))
  assert.ok(small.includes('Không bắt buộc với mẻ này'))
  assert.ok(!small.includes('Lượng mẫu'))
  const existing = render({ hasValidSample: true })
  assert.ok(existing.includes('Đã có mẫu hợp lệ'))
  assert.ok(!existing.includes('Lượng mẫu'))
  const { ImageField } = await server.ssrLoadModule('/src/page/portal/PortalUI.jsx')
  const actualImageField = renderToStaticMarkup(React.createElement(ImageField, { camera: true, label: 'Ảnh thành phẩm thực tế', value: '', onChange() {} }))
  assert.ok(actualImageField.includes('capture="environment"'))
  assert.ok(actualImageField.includes('type="file"'))
  const { default: client } = await server.ssrLoadModule('/src/api/httpClient.js')
  const { uploadImage } = await server.ssrLoadModule('/src/api/kitchenApi.js')
  client.defaults.baseURL = 'https://backend.example.test'
  client.defaults.adapter = async (config) => {
    assert.equal(config.url, '/upload/images')
    assert.equal(config.method, 'post')
    assert.equal(config.data.get('file').name, 'finished.jpg')
    return { status: 201, statusText: 'Created', headers: {}, config, data: { success: true, data: { path: '/uploads/finished.jpg', filename: 'finished.jpg' } } }
  }
  const result = await uploadImage(new File(['test-image'], 'finished.jpg', { type: 'image/jpeg' }))
  assert.equal(result.imageUrl, 'https://backend.example.test/uploads/finished.jpg')
  console.log('PASS confirmation SSR: capture at recording, read-only QC photo, sample dossier states, disabled completion and production upload contract.')
} finally {
  await server.close()
}
