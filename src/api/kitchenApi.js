import http from './httpClient'
export const api = {
  list: (resource, params, signal) => http.get(resource, { params, signal }),
  create: (resource, value) => http.post(resource, value),
  update: (resource, id, value) =>
    http.put(`${resource}${id ? '/' + id : ''}`, value),
  action: (resource, id, action, value = {}) =>
    http.post(`${resource}/${id}/${action}`, value),
}
export async function allPages(resource, params, signal) {
  const rows = []
  let page = 1
  while (true) {
    const result = await http.get(resource, {
      params: { ...params, page, size: 100 },
      signal,
    })
    if (Array.isArray(result)) return result
    rows.push(...(result?.data || []))
    if (!result?.data?.length || rows.length >= result.total) return rows
    page += 1
  }
}
export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  return http.post('/upload/images', form)
}
