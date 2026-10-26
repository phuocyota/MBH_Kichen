export const mealOptions = [
  { id: 'BREAKFAST', name: 'Bữa sáng' },
  { id: 'LUNCH', name: 'Bữa trưa' },
  { id: 'AFTERNOON', name: 'Bữa xế' },
  { id: 'DINNER', name: 'Bữa tối' },
]

export function routeDate(search, fallback) {
  const date = search.get('date')
  return /^\d{4}-\d{2}-\d{2}$/.test(date || '') &&
    Number.isFinite(Date.parse(date)) &&
    new Date(date).toISOString().slice(0, 10) === date
    ? date : fallback
}

export function routeMeal(search) {
  const meal = search.get('mealPeriod')
  return mealOptions.some((option) => option.id === meal) ? meal : ''
}

export function withDate(path, date, filters = {}) {
  const [target, hash] = path.split('#')
  const [pathname, query] = target.split('?')
  const search = new URLSearchParams(query)
  search.set('date', date)
  for (const [key, value] of Object.entries(filters)) {
    if (value) search.set(key, value)
    else search.delete(key)
  }
  return `${pathname}?${search}${hash ? `#${hash}` : ''}`
}
