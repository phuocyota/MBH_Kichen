import axios from 'axios'
export const AUTH_KEY = 'kitchen_session'
const messages = {
  KITCHEN_SHIFT_LOCKED:
    'Ca đã xác nhận hoặc khóa. Cần quản lý mở lại để điều chỉnh',
  SAMPLE_REQUIRED: 'Món này cần mẫu lưu hợp lệ trước khi hoàn tất',
  ACTUAL_QUANTITY_REQUIRED: 'Cần nhập sản lượng thực tế sau khi lấy mẫu',
  ACTUAL_BELOW_IMPORTED:
    'Sản lượng thực tế không được thấp hơn số thành phẩm đã nhập',
  IMPORT_EXCEEDS_ACTUAL_QUANTITY: 'Tổng nhập thành phẩm vượt sản lượng thực tế',
  RETURN_EXCEEDS_EXPORT: 'Lượng thu hồi vượt phần đã xuất chưa thu hồi',
  FINISHED_STOCK_SHORTAGE: 'Lô thành phẩm không đủ tồn',
  FINISHED_LOT_EXPIRED: 'Lô thành phẩm đã quá hạn phục vụ',
  LOT_EXPIRED: 'Lô đã hết hạn dùng',
  LOT_ALLOCATION_REQUIRED: 'Cần chọn lô xuất, kể cả khi chỉ có một lô',
  LOT_ALLOCATION_MISMATCH: 'Tổng phân bổ lô phải bằng lượng xuất',
  INCOMPATIBLE_INGREDIENT_UNIT: 'Đơn vị nhập và đơn vị tồn không cùng chiều đo',
  PRODUCT_CLASSIFICATION_IN_USE:
    'Hàng đã có tồn, công thức hoặc giao dịch; cần quy trình chuyển đổi riêng',
  OPENING_BALANCE_MISMATCH: 'Tổng tồn mở đầu theo lô chưa khớp tồn hiện tại',
  OTHER_WAREHOUSE_OPENING_REQUIRED:
    'Hàng còn tồn chưa phân bổ ở kho khác; cần đối chiếu các kho trước khi bật theo lô',
  USE_LOT_STOCK_TAKE: 'Hàng theo lô phải điều chỉnh qua kiểm kê từng lô',
  KITCHEN_MODULE_DISABLED: 'Chi nhánh chưa được bật nghiệp vụ bếp',
}
export function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_KEY) || 'null')
  } catch {
    return null
  }
}
const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
})
httpClient.interceptors.request.use((config) => {
  const session = readSession()
  if (session?.accessToken)
    config.headers.Authorization = `Bearer ${session.accessToken}`
  return config
})
httpClient.interceptors.response.use(
  (response) => {
    if (response.data?.success === false)
      throw Object.assign(
        new Error(response.data.message || 'Yêu cầu thất bại'),
        { details: response.data },
      )
    return response.data?.success === true ? response.data.data : response.data
  },
  (error) => {
    const details = error.response?.data
    error.message =
      (Array.isArray(details?.message)
        ? details.message.join(', ')
        : details?.message) ||
      error.message ||
      'Không kết nối được máy chủ'
    error.status = error.response?.status
    error.code = details?.code || details?.message?.code
    error.details = details
    error.message =
      messages[error.code] ||
      messages[error.message] ||
      (error.status === 403
        ? 'Bạn không có quyền thực hiện thao tác này'
        : error.message)
    if (error.status === 409) window.dispatchEvent(new Event('kitchen:reload'))
    if (error.status === 401 && !error.config?.url?.startsWith('/auth/login')) {
      sessionStorage.removeItem(AUTH_KEY)
      window.dispatchEvent(new Event('kitchen:session-expired'))
    }
    return Promise.reject(error)
  },
)
export default httpClient
