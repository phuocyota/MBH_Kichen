import {
  QrCode,
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  Home,
  Utensils,
} from 'lucide-react'

export const navigationItems = [
  {label:'Nguyên/nhiên liệu',icon:ClipboardList,children:[{label:'Nhập - Xuất nguyên/nhiên liệu',path:'/dashboard/materials'},{label:'Lô và hạn dùng',path:'/dashboard/materials/lots'},{label:'Nhu cầu / Tiêu hao',path:'/dashboard/materials/consumption'}]},
  {label:'Kế hoạch bán trú',icon:CalendarDays,path:'/dashboard/kitchen-plan/boarding'},
  {label:'Đơn căn tin',icon:Utensils,path:'/dashboard/cooking/tickets'},
  {label:'Chốt ca',icon:FileText,path:'/dashboard/shift/summary'},
  {label:'In tem / Mã QR',icon:QrCode,path:'/dashboard/barcode-print'},
  {label:'Cấu hình bếp',icon:CalendarDays,path:'/dashboard/configuration'},
  {
    label: 'Tổng quan',
    path: '/dashboard',
    icon: Home,
  },
  {
    label: 'Kế hoạch & Chế biến',
    icon: CalendarDays,
    children: [
      { label: 'Kế hoạch hôm nay', path: '/dashboard/kitchen-plan/today' },
      { label: 'Thực đơn', path: '/dashboard/kitchen-plan/menu' },
      { label: 'Theo dõi chế biến', path: '/dashboard/cooking/tracking' },
    ],
  },
  {
    label: 'Nhập - Xuất & Tồn',
    icon: ClipboardList,
    children: [
      { label: 'Nhập món', path: '/dashboard/meal-flow/import' },
      { label: 'Xuất món', path: '/dashboard/meal-flow/export' },
      { label: 'Món còn lại', path: '/dashboard/inventory/remaining' },
      { label: 'Lịch sử', path: '/dashboard/meal-flow/history' },
    ],
  },
  {
    label: 'Lưu mẫu & Hủy',
    icon: FlaskConical,
    children: [
      { label: 'Quản lý lưu mẫu', path: '/dashboard/samples/manage' },
      { label: 'Hủy món', path: '/dashboard/inventory/cancel' },
      { label: 'Lịch sử', path: '/dashboard/samples/history' },
    ],
  },
  {
    label: 'Báo cáo',
    path: '/dashboard/reports',
    icon: FileText,
  },
]

export const systemBrand = {
  name: 'KIDO CANTEEN',
  area: 'Quản lý Bếp',
  icon: Utensils,
}
