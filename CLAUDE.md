# CLAUDE.md - KIDO CANTEEN Kitchen Management

## Project Overview
- **Name**: kitchen-staff (KIDO CANTEEN - Quản lý Bếp)
- **Stack**: React 19 + Vite + Tailwind CSS v4
- **Type**: Kitchen staff management portal with real-time tracking
- **Language**: Vietnamese throughout

## Tech Stack
| Package | Purpose |
|---------|---------|
| react 19 | UI framework |
| react-router-dom 7 | Routing |
| axios | HTTP client |
| socket.io-client | Real-time updates |
| lucide-react | Icons |
| tailwindcss 4 | Styling |
| oxlint | Linting |

## Project Structure
```
src/
├── api/
│   ├── httpClient.js      # Axios instance + auth token handling
│   └── kitchenApi.js      # CRUD helpers + allPages + uploadImage
├── auth/
│   ├── AuthProvider.jsx    # Auth context, login/logout, branch selection
│   └── authContext.js     # Auth context definition
├── components/            # Reusable UI components
│   ├── AppLayout.jsx      # Main layout with sidebar navigation
│   ├── CookingTracking/   # Tracking form + table
│   ├── Dashboard/         # Dashboard stats, alerts, cooking list
│   ├── KitchenPlan/       # Plan/menu forms and tables
│   ├── MealExportPage/    # Meal export form + table
│   ├── MealImportPage/    # Meal import form + table
│   ├── MealInventoryPage/ # Inventory management
│   ├── MealSamplePage/    # Sample management
│   └── MealCancelPage/    # Cancellation handling
├── datas/
│   └── navigation.js      # Navigation config + brand settings
├── hooks/
│   └── useKitchenData.js  # Data fetching hook
├── page/
│   ├── LoginPage.jsx      # Login with role selection
│   ├── NotFoundPage.jsx   # 404 page
│   ├── portal/            # New portal pages (portal-first approach)
│   │   ├── DocumentPages.jsx   # Generic document CRUD
│   │   ├── OperationsPages.jsx # Boarding, Cooking, Summary
│   │   ├── MaterialPages.jsx    # Materials, Lots, Consumption
│   │   ├── ConfigurationPage.jsx # Kitchen config
│   │   └── PortalContext.jsx     # Portal state management
│   └── ...                # Legacy page components
└── App.jsx                # Route definitions
```

## Routing
All routes defined in [App.jsx](src/App.jsx). Protected routes wrapped with `<ProtectedRoute />`.

**Route Groups:**
- `/login` - Public login page
- `/dashboard/*` - Protected routes (require auth)
  - `dashboard/` - Summary overview
  - `kitchen-plan/*` - Plan today, boarding, menu
  - `cooking/*` - Tracking, tickets
  - `meal-flow/*` - Import, export, history
  - `inventory/*` - Remaining, cancel
  - `samples/*` - Manage, history
  - `materials/*` - Materials, lots, consumption
  - `reports` - Reports view
  - `shift/summary` - Shift closing
  - `configuration` - Kitchen config

## Authentication
- **Roles**: `KITCHEN`, `MANAGER`, `ADMIN`
- **Session**: Stored in sessionStorage as JSON
- **Branch**: Admin can switch branches; kitchen/manager tied to one branch
- **Logout**: Dispatch `kitchen:session-expired` event for cross-tab sync
- **Header**: `Authorization: Bearer {token}`

## API Patterns
```js
import { api, allPages, uploadImage } from './api/kitchenApi'

// CRUD
api.list(resource, params)
api.create(resource, data)
api.update(resource, id, data)
api.action(resource, id, action, data)

// Fetch all pages (auto-pagination)
allPages(resource, params, signal)

// Upload
uploadImage(file)
```

## Key Components

### AppLayout
Sidebar navigation + outlet for nested routes. Reads navigation from [navigation.js](src/datas/navigation.js).

### DocumentPages
Generic CRUD for all document types via `kind` prop:
- `manual-plans`, `menus`, `finished-imports`, `finished-exports`
- `finished-inventory`, `samples`, `disposals`, `shift-closings`

### PortalContext
Provides portal-level state for document pages.

## Common Operations

### Adding a new page
1. Add route in App.jsx
2. Add navigation item in datas/navigation.js
3. Create component in appropriate folder

### Adding a new document type
1. Add to DocumentPages.jsx switch case
2. Add route with unique `kind` prop
3. Add navigation link

## Scripts
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run oxlint
npm run preview  # Preview production build
```

## Environment Variables
See `.env.example` for required variables.
