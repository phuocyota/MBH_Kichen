# MBH Kitchen Portal

React/Vite portal cho nhân viên bếp và quản lý căn tin. Kết nối backend `../mbh` qua REST/JWT và Socket.IO.

## Prerequisites

- Node.js 18+
- Backend MBH chạy tại `http://localhost:3002` (hoặc cấu hình khác qua `.env.local`)
- Backend bật CORS cho origin FE và `KITCHEN_MODULE_ENABLED=true`

## Setup

```bash
# Cài dependencies
npm ci

# Tạo file cấu hình
cp .env.example .env.local
```

Chỉnh sửa `.env.local` nếu cần:

| Biến | Mặc định | Mô tả |
|------|----------|--------|
| `VITE_API_BASE_URL` | `http://localhost:3002` | Base URL của backend |
| `VITE_SOCKET_URL` | `http://localhost:3002` | Socket.IO server |

## Scripts

```bash
npm run dev      # Chạy dev server
npm run build    # Build production
npm run lint     # Kiểm tra lint
npm run preview  # Preview build
npm run test:timezone  # Test timezone (Asia/Bangkok)
```

## Tài khoản

- **Nhân viên bếp (KITCHEN)**: Cần có Employee đang hoạt động trong cùng chi nhánh
- **Quản lý (MANAGER)**: Dùng tài khoản MANAGER
- **Admin**: Không có chi nhánh trong JWT — phải chọn chi nhánh trước khi làm việc

> **Lưu ý**: Không có cơ chế refresh token. Hết phiên phải đăng nhập lại.

## Cấu trúc dự án

```
src/
├── api/           # HTTP client và API endpoints
├── auth/          # Auth context và provider
├── components/    # Shared components (Dashboard, KitchenPlan, MealFlow, ...)
├── datas/         # Static data (navigation, mock data cũ)
├── hooks/         # Custom React hooks
└── page/
    ├── LoginPage.jsx
    ├── DashboardPage.jsx
    ├── portal/    # Modular portal pages
    │   ├── ConfigurationPage.jsx
    │   ├── DocumentPages.jsx
    │   ├── MaterialsPages.jsx
    │   ├── OperationsPages.jsx
    │   └── ...
    └── ...
```

## Routes

| Route | Mô tả |
|-------|-------|
| `/login` | Trang đăng nhập |
| `/dashboard` | Tổng quan (Dashboard) |
| `/dashboard/kitchen-plan/today` | Kế hoạch hôm nay |
| `/dashboard/kitchen-plan/boarding` | Kế hoạch bán trú |
| `/dashboard/kitchen-plan/menu` | Thực đơn |
| `/dashboard/cooking/tracking` | Theo dõi chế biến |
| `/dashboard/cooking/tickets` | Đơn căn tin |
| `/dashboard/meal-flow/import` | Nhập món |
| `/dashboard/meal-flow/export` | Xuất món |
| `/dashboard/inventory/remaining` | Món còn lại |
| `/dashboard/meal-flow/history` | Lịch sử nhập/xuất |
| `/dashboard/samples/manage` | Quản lý lưu mẫu |
| `/dashboard/samples/history` | Lịch sử lưu mẫu |
| `/dashboard/inventory/cancel` | Hủy món |
| `/dashboard/shift/summary` | Chốt ca |
| `/dashboard/materials` | Nguyên/nhiên liệu |
| `/dashboard/materials/lots` | Lô và hạn dùng |
| `/dashboard/materials/consumption` | Nhu cầu / Tiêu hao |
| `/dashboard/reports` | Báo cáo |
| `/dashboard/configuration` | Cấu hình bếp |

## Luồng nghiệp vụ chính

### 1. Kế hoạch bán trú
- Lập kế hoạch bán trú hoặc kế hoạch bổ sung thủ công
- Quản lý thực đơn và công thức định lượng

### 2. Mẻ chế biến
```
Chờ làm → Đang chế biến → Sẵn sàng → Hoàn tất
```
- Nhập sản lượng thực tế sau khi lấy mẫu

### 3. Nhập/Xuất thành phẩm
- Tạo phiếu nhập thành phẩm từ mẻ hoàn tất
- Xuất chọn lô còn hạn

### 4. Tồn kho nguyên liệu
- Đối chiếu tồn mở đầu theo từng lô
- Nhập nguyên/nhiên liệu tăng tồn ngay
- Xuất và tiêu hao cần chọn lô rõ ràng

### 5. Lưu mẫu & Hủy
- Lấy/xử lý mẫu, xác nhận ca
- Thu hồi vào cách ly
- Quản lý cho phục vụ lại hoặc xác nhận hủy

## Upload ảnh

Ảnh tải lên qua endpoint `/upload/images`.

## Kiểm thử

```bash
# Lint
npm run lint

# Build
npm run build

# Test timezone (xác nhận thời gian dùng Asia/Bangkok)
npm run test:timezone
```

> **Lưu ý**: Build/lint không chứng minh đăng nhập thật, database, Socket.IO, upload ảnh hoặc nhiều thiết bị. Cần nghiệm thu trên staging.

## Tài liệu bổ sung

- Hướng dẫn kiểm thử, migration PostgreSQL: `../mbh/KITCHEN_API_HANDOFF.md`
