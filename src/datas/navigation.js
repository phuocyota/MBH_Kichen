import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  Home,
  Utensils,
} from 'lucide-react'

export const navigationItems = [
  {
    label: 'Tổng quan',
    path: '/dashboard',
    icon: Home,
  },
  {
    label: 'Nhận việc & Chế biến',
    icon: ClipboardList,
    path: '/dashboard/kitchen/tasks',
    relatedPaths: ['/dashboard/cooking/tickets', '/dashboard/cooking/tracking'],
  },
  {
    label: 'Thực đơn & Công thức',
    icon: BookOpen,
    path: '/dashboard/menu/dishes',
    relatedPaths: ['/dashboard/menu/recipes'],
  },
  {label:'Nguyên/nhiên liệu',icon:ClipboardList,children:[{label:'Tồn nguyên/nhiên liệu',path:'/dashboard/materials'},{label:'Lô và hạn dùng',path:'/dashboard/materials/lots'},{label:'Nhu cầu / Tiêu hao',path:'/dashboard/materials/consumption'}]},
  {
    label: 'Kế hoạch',
    icon: CalendarDays,
    children: [
      { label: 'Kế hoạch hôm nay', path: '/dashboard/kitchen-plan/today' },
      { label: 'Kế hoạch bán trú', path: '/dashboard/kitchen-plan/boarding' },
      { label: 'Thực đơn theo ngày/tuần', path: '/dashboard/kitchen-plan/menu' },
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

export function isNavigationItemActive(item, pathname) {
  return item.path === pathname || Boolean(item.relatedPaths?.includes(pathname))
}

export const systemBrand = {
  name: 'KIDO CANTEEN',
  area: 'Quản lý Bếp',
  icon: Utensils,
}
