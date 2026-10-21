import {
  QrCode,
  BookOpen,
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
  { label: 'Nhận việc & Chế biến', icon: ClipboardList, path: '/dashboard/kitchen/tasks' },
  {
    label: 'Thực đơn & Công thức',
    icon: BookOpen,
    children: [
      { label: 'Danh mục món ăn', path: '/dashboard/menu/dishes' },
      { label: 'Công thức & Định lượng', path: '/dashboard/menu/recipes' },
      { label: 'Thực đơn theo ngày/tuần', path: '/dashboard/kitchen-plan/menu' },
    ],
  },
  {label:'Nguyên/nhiên liệu',icon:ClipboardList,children:[{label:'Tồn nguyên/nhiên liệu',path:'/dashboard/materials'},{label:'Lô và hạn dùng',path:'/dashboard/materials/lots'},{label:'Nhu cầu / Tiêu hao',path:'/dashboard/materials/consumption'}]},
  {label:'Kế hoạch bán trú',icon:CalendarDays,path:'/dashboard/kitchen-plan/boarding'},
  {label:'Đơn căn tin',icon:Utensils,path:'/dashboard/cooking/tickets'},
  {
    label: 'Kế hoạch & Chế biến',
    icon: CalendarDays,
    children: [
      { label: 'Kế hoạch hôm nay', path: '/dashboard/kitchen-plan/today' },
      { label: 'Theo dõi chế biến', path: '/dashboard/cooking/tracking' },
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
