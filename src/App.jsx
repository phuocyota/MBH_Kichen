import { Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import AppLayout from './components/AppLayout'
import LoginPage from './page/LoginPage'
import NotFoundPage from './page/NotFoundPage'
import { ProtectedRoute } from './auth/AuthProvider'
import { PortalContext } from './page/portal/PortalContext'
import { DocumentPage } from './page/portal/DocumentPages'
import {
  BoardingPage,
  CookingPage,
  SummaryPage,
} from './page/portal/OperationsPages'
import { MaterialsPage, ConsumptionPage } from './page/portal/MaterialPages'
import { ConfigurationPage } from './page/portal/ConfigurationPage'
const BarcodePrintPage = lazy(() => import('./page/print/BarcodePrintPage'))
export default function App() {
  return (
    <Routes>
      <Route index element={<LoginPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="dashboard" element={<AppLayout />}>
          <Route element={<PortalContext />}>
            <Route index element={<SummaryPage />} />
            <Route
              path="kitchen-plan/today"
              element={<DocumentPage kind="manual-plans" />}
            />
            <Route path="kitchen-plan/boarding" element={<BoardingPage />} />
            <Route
              path="kitchen-plan/menu"
              element={<DocumentPage kind="menus" />}
            />
            <Route path="cooking/tracking" element={<CookingPage />} />
            <Route path="cooking/tickets" element={<CookingPage tickets />} />
            <Route
              path="meal-flow/import"
              element={<DocumentPage kind="finished-imports" />}
            />
            <Route
              path="meal-flow/export"
              element={<DocumentPage kind="finished-exports" />}
            />
            <Route
              path="inventory/remaining"
              element={<DocumentPage kind="finished-inventory" />}
            />
            <Route path="meal-flow/history" element={<SummaryPage history />} />
            <Route
              path="samples/manage"
              element={<DocumentPage kind="samples" />}
            />
            <Route
              path="samples/history"
              element={<DocumentPage kind="samples" historyOnly />}
            />
            <Route
              path="inventory/cancel"
              element={<DocumentPage kind="disposals" />}
            />
            <Route path="reports" element={<SummaryPage report />} />
            <Route
              path="shift/summary"
              element={<DocumentPage kind="shift-closings" />}
            />
            <Route path="materials" element={<MaterialsPage />} />
            <Route path="materials/lots" element={<MaterialsPage lotsOnly />} />
            <Route path="materials/consumption" element={<ConsumptionPage />} />
            <Route path="configuration" element={<ConfigurationPage />} />
            <Route
              path="barcode-print"
              element={
                <Suspense fallback={<p role="status">Đang tải trang in tem…</p>}>
                  <BarcodePrintPage />
                </Suspense>
              }
            />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
