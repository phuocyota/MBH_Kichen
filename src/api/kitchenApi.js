/**
 * Kitchen API Service
 * Kết nối frontend với backend NestJS API
 *
 * Module này cung cấp hai bộ API song song để tương thích với cả
 * code mới (services/kitchenService.js, useKitchenApi.js) và code
 * portal cũ (useKitchenData, DocumentPages, MaterialPages, ...):
 *   - Bộ legacy: `api`, `allPages`, `uploadImage` (dùng httpClient/axios,
 *     URL dạng '/kitchen/...', '/stock-lots', '/products', ...).
 *   - Bộ theo tài nguyên: `menuApi`, `mealPlanApi`, ... (dùng fetch).
 */

import httpClient from './httpClient'

// ============================================
// LEGACY COMPAT LAYER
// Dùng bởi hooks/useKitchenData, page/portal/*, src/hooks/useKitchenData.js
// ============================================

function buildQuery(params = {}) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) value.forEach((v) => search.append(key, v))
    else search.set(key, value)
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export async function uploadImage(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await httpClient.post('/uploads/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data || {}
}

export const api = {
  list: (resource, params, signal) =>
    httpClient.get(`${resource}${buildQuery(params)}`, { signal }),
  create: (resource, data) => httpClient.post(resource, data),
  update: (resource, id, data) => httpClient.put(`${resource}/${id}`, data),
  action: (resource, id, action, data) =>
    httpClient.post(`${resource}/${id}/${action}`, data),
}

export async function allPages(resource, params, signal) {
  const first = await api.list(resource, { ...params, page: 1, size: 100 }, signal)
  if (Array.isArray(first)) return first
  const list = Array.isArray(first?.data) ? first.data : []
  const total = Number(first?.total || list.length)
  const pageSize = 100
  if (!Number.isFinite(total) || total <= list.length) return list
  const pages = Math.ceil(total / pageSize)
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      api
        .list(resource, { ...params, page: i + 2, size: pageSize }, signal)
        .then((r) => (Array.isArray(r?.data) ? r.data : [])),
    ),
  )
  return list.concat(...rest)
}

// ============================================
// RESOURCE-SPECIFIC API (theo tài nguyên)
// Dùng bởi services/kitchenService.js, useKitchenApi.js
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Token từ localStorage (giả định - cần tích hợp với auth system thực tế)
function getAuthHeaders() {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}

// ============================================
// MENUS API
// ============================================

export const menuApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.mealPeriod) query.set('mealPeriod', params.mealPeriod);
    if (params.shift) query.set('shift', params.shift);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/menus?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/menus/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/menus`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/menus/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  lock: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/menus/${id}/lock`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  copy: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/menus/${id}/copy`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ============================================
// MEAL PLANS (KẾ HOẠCH) API
// ============================================

export const mealPlanApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.mealPeriod) query.set('mealPeriod', params.mealPeriod);
    if (params.shift) query.set('shift', params.shift);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/meal-plans?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/meal-plans/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/meal-plans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/meal-plans/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  lock: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/meal-plans/${id}/lock`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  addAdjustment: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/meal-plans/${id}/adjustments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  copy: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/meal-plans/${id}/copy`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ============================================
// PRODUCTION BATCHES API
// ============================================

export const batchApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.stationId) query.set('stationId', params.stationId);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/batches?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/batches/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/batches/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  transition: async (id, target, data = {}) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/batches/${id}/${target.toLowerCase()}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  start: async (id, data = {}) => batchApi.transition(id, 'PREPARING', data),
  ready: async (id, data = {}) => batchApi.transition(id, 'READY', data),
  complete: async (id, data = {}) => batchApi.transition(id, 'COMPLETED', data),
};

// ============================================
// FINISHED IMPORTS (NHẬP MÓN) API
// ============================================

export const finishedImportApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.shift) query.set('shift', params.shift);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/finished-imports?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/finished-imports/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/finished-imports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/finished-imports/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  confirm: async (id, data = {}) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/finished-imports/${id}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ============================================
// FINISHED EXPORTS (XUẤT MÓN) API
// ============================================

export const finishedExportApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.shift) query.set('shift', params.shift);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/finished-exports?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/finished-exports/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/finished-exports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/finished-exports/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  returns: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/finished-exports/${id}/returns`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ============================================
// FINISHED INVENTORY (TỒN KHO) API
// ============================================

export const finishedInventoryApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.shift) query.set('shift', params.shift);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/finished-inventory?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/finished-inventory/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  adjustments: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/finished-inventory/${id}/adjustments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  release: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/finished-inventory/${id}/release`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ============================================
// DISPOSALS (HỦY MÓN) API
// ============================================

export const disposalApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.shift) query.set('shift', params.shift);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/disposals?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/disposals/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/disposals`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  confirmDisposal: async (id, data = {}) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/disposals/${id}/confirm-disposal`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ============================================
// SAMPLES (LƯU MẪU) API
// ============================================

export const sampleApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.shift) query.set('shift', params.shift);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/samples?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/samples/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/samples`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/samples/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  process: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/samples/${id}/process`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ============================================
// SHIFT CLOSINGS (CHỐT CA) API
// ============================================

export const shiftClosingApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.shift) query.set('shift', params.shift);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/shift-closings?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/shift-closings/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/shift-closings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  confirm: async (id, data = {}) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/shift-closings/${id}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  approve: async (id, data = {}) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/shift-closings/${id}/approve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  reopen: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/shift-closings/${id}/reopen`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ============================================
// DASHBOARD & REPORTS API
// ============================================

export const dashboardApi = {
  getSummary: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.shift) query.set('shift', params.shift);

    const res = await fetch(`${API_BASE_URL}/kitchen/dashboard?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getHistory: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.shift) query.set('shift', params.shift);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/history?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getMealFlowReport: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.shift) query.set('shift', params.shift);

    const res = await fetch(`${API_BASE_URL}/kitchen/reports/meal-flow?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getOperationsReport: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.shift) query.set('shift', params.shift);

    const res = await fetch(`${API_BASE_URL}/kitchen/reports/operations?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// ============================================
// KITCHEN TICKETS API
// ============================================

export const ticketApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.stationId) query.set('stationId', params.stationId);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/tickets?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/tickets/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  start: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/tickets/${id}/start`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  ready: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/tickets/${id}/ready`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// ============================================
// RECIPES API
// ============================================

export const recipeApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.productId) query.set('productId', params.productId);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/recipes?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/recipes/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/recipes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/recipes/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  activate: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/recipes/${id}/activate`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// ============================================
// CONSUMPTION SESSIONS API
// ============================================

export const consumptionApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.mealPeriod) query.set('mealPeriod', params.mealPeriod);
    if (params.stationId) query.set('stationId', params.stationId);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/kitchen/consumption-sessions?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/consumption-sessions/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/consumption-sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  confirm: async (id, data = {}) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/consumption-sessions/${id}/confirm`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  getDemand: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.mealPeriod) query.set('mealPeriod', params.mealPeriod);
    if (params.stationId) query.set('stationId', params.stationId);

    const res = await fetch(`${API_BASE_URL}/kitchen/demand?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

// ============================================
// PRODUCTS & STATIONS API
// ============================================

export const productApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.productType) query.set('productType', params.productType);
    if (params.isActive !== undefined) query.set('isActive', params.isActive);
    if (params.page) query.set('page', params.page);
    if (params.size) query.set('size', params.size);

    const res = await fetch(`${API_BASE_URL}/products?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

export const stationApi = {
  list: async (params = {}) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/stations`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  get: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/stations/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/stations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/stations/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/stations/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  assignProducts: async (stationId, productIds) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/stations/${stationId}/products`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productIds }),
    });
    return handleResponse(res);
  },
};

export const assignmentApi = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.date) query.set('date', params.date);
    if (params.shift) query.set('shift', params.shift);

    const res = await fetch(`${API_BASE_URL}/kitchen/assignments?${query}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  create: async (data) => {
    const res = await fetch(`${API_BASE_URL}/kitchen/assignments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};

// ============================================
// EXPORT ALL
// ============================================

const kitchenApi = {
  menu: menuApi,
  mealPlan: mealPlanApi,
  batch: batchApi,
  finishedImport: finishedImportApi,
  finishedExport: finishedExportApi,
  finishedInventory: finishedInventoryApi,
  disposal: disposalApi,
  sample: sampleApi,
  shiftClosing: shiftClosingApi,
  dashboard: dashboardApi,
  ticket: ticketApi,
  recipe: recipeApi,
  consumption: consumptionApi,
  product: productApi,
  station: stationApi,
  assignment: assignmentApi,
}

export default kitchenApi
export { kitchenApi }
