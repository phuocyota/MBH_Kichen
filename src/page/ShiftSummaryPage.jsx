import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Lock,
  PackageCheck,
  ShieldCheck,
  Trash2,
  Unlock,
} from 'lucide-react'
import KitchenPlanFilters from '../components/KitchenPlan/KitchenPlanFilters'
import KitchenPlanHeader from '../components/KitchenPlan/KitchenPlanHeader'
import { useAuth } from '../auth/authContext'
import { kitchenShiftOptions } from '../datas/kitchenPlanData'
import {
  buildShiftClosingReport,
  findShiftClosing,
  getShiftClosingId,
  readStoredShiftClosings,
  saveStoredShiftClosings,
} from '../datas/shiftCloseData'
import {
  StatusBadge,
  SummaryCards,
} from './mealFlowPageComponents'
import {
  formatDateTime,
  getCurrentDate,
  getCurrentDateTime,
  getMealFlowState,
} from './mealFlowUtils'

function ShiftReportTable({ report }) {
  const rows = [
    ['Phiếu nhập', report.importCount],
    ['Tổng nhập', report.importedQuantity],
    ['Tổng xuất', report.exportedQuantity],
    ['Thu hồi', report.recalledQuantity],
    ['Tồn cuối ca', report.remainingQuantity],
    ['Phiếu hủy', report.cancelCount],
    ['Số lượng hủy', report.canceledQuantity],
    ['Mẫu lưu', report.sampleCount],
    ['Mẫu chưa xử lý', report.pendingSampleCount],
  ]

  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5 sm:p-5">
      <h3 className="text-xl font-bold tracking-normal text-slate-950">
        Báo cáo cuối ca
      </h3>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left">
          <thead>
            <tr className="text-sm text-slate-500">
              <th className="px-3 py-2 font-semibold">Chỉ tiêu</th>
              <th className="px-3 py-2 font-semibold">Giá trị</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, value]) => (
              <tr className="bg-blue-50/60 transition hover:bg-blue-100/70" key={label}>
                <td className="rounded-l-xl px-3 py-4 text-sm font-bold text-slate-950">{label}</td>
                <td className="rounded-r-xl px-3 py-4 text-sm font-black text-blue-700">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ShiftConfirmPanel({ closing, onApprove, onConfirm, onUnlock }) {
  return (
    <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-normal text-slate-950">
            Xác nhận chốt ca
          </h3>
          <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <p><span className="font-bold text-slate-800">Nhân viên xác nhận:</span> {closing?.confirmedBy || 'Chưa xác nhận'}</p>
            <p><span className="font-bold text-slate-800">Thời gian xác nhận:</span> {formatDateTime(closing?.confirmedAt)}</p>
            <p><span className="font-bold text-slate-800">Quản lý duyệt:</span> {closing?.approvedBy || 'Chưa duyệt'}</p>
            <p><span className="font-bold text-slate-800">Thời gian duyệt:</span> {formatDateTime(closing?.approvedAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-3">
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={Boolean(closing?.confirmedAt)}
            onClick={onConfirm}
          >
            <CheckCircle2 size={18} aria-hidden="true" />
            Nhân viên xác nhận
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={!closing?.confirmedAt || Boolean(closing?.approvedAt)}
            onClick={onApprove}
          >
            <ShieldCheck size={18} aria-hidden="true" />
            Quản lý duyệt
          </button>
          <button
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            type="button"
            disabled={!closing?.locked}
            onClick={onUnlock}
          >
            <Unlock size={18} aria-hidden="true" />
            Mở khóa
          </button>
        </div>
      </div>
    </section>
  )
}

function ShiftSummaryPage() {
  const { session } = useAuth()
  const [selectedDate, setSelectedDate] = useState(getCurrentDate)
  const [selectedShift, setSelectedShift] = useState(kitchenShiftOptions[1])
  const [shiftClosings, setShiftClosings] = useState(readStoredShiftClosings)
  const currentStaff = {
    fullName: session?.fullName || 'Nhân viên bếp',
    role: session?.userType === 'ADMIN' ? 'Quản lý' : session?.userType === 'MANAGER' ? 'Quản lý' : 'Nhân viên bếp',
  }
  const state = getMealFlowState()
  const closing = findShiftClosing(selectedDate, selectedShift, shiftClosings)
  const report = useMemo(
    () => buildShiftClosingReport({ date: selectedDate, shift: selectedShift, state }),
    [selectedDate, selectedShift, state],
  )

  function saveClosing(nextClosing) {
    const exists = shiftClosings.some((item) => item.id === nextClosing.id)
    const nextList = exists
      ? shiftClosings.map((item) => (item.id === nextClosing.id ? nextClosing : item))
      : [nextClosing, ...shiftClosings]

    setShiftClosings(nextList)
    saveStoredShiftClosings(nextList)
  }

  function confirmShift() {
    saveClosing({
      ...(closing || {}),
      id: getShiftClosingId(selectedDate, selectedShift),
      date: selectedDate,
      shift: selectedShift,
      confirmedAt: getCurrentDateTime(),
      confirmedBy: currentStaff.fullName,
      confirmedRole: currentStaff.role,
      locked: false,
      report,
    })
  }

  function approveShift() {
    saveClosing({
      ...closing,
      approvedAt: getCurrentDateTime(),
      approvedBy: currentStaff.fullName,
      approvedRole: currentStaff.role,
      locked: true,
      report,
    })
  }

  function unlockShift() {
    saveClosing({
      ...closing,
      unlockedAt: getCurrentDateTime(),
      unlockedBy: currentStaff.fullName,
      locked: false,
    })
  }

  return (
    <section className="space-y-6">
      <KitchenPlanHeader title="Chốt ca" description="Nhân viên xác nhận dữ liệu cuối ca, quản lý duyệt để tạo báo cáo và khóa dữ liệu của ca." actionIcon={ClipboardCheck} />
      <KitchenPlanFilters
        date={selectedDate}
        shift={selectedShift}
        shiftOptions={kitchenShiftOptions}
        onDateChange={setSelectedDate}
        onShiftChange={setSelectedShift}
      />
      <SummaryCards cards={[
        { label: 'Trạng thái', value: closing?.locked ? 'Đã khóa' : closing?.approvedAt ? 'Đã duyệt' : closing?.confirmedAt ? 'Chờ duyệt' : 'Chưa chốt', icon: closing?.locked ? Lock : FileText },
        { label: 'Tổng nhập', value: report.importedQuantity, icon: PackageCheck },
        { label: 'Tổng hủy', value: report.canceledQuantity, icon: Trash2 },
        { label: 'Mẫu lưu', value: report.sampleCount, icon: ClipboardCheck },
      ]} />
      <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-950/5 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={closing?.locked ? 'Đã xử lý' : closing?.approvedAt ? 'Đã xác nhận' : closing?.confirmedAt ? 'Chờ xác nhận' : 'Đang lưu'} />
          <p className="text-sm font-semibold text-slate-600">
            Sau khi quản lý duyệt, dữ liệu ca {selectedShift} ngày {selectedDate.split('-').reverse().join('/')} sẽ bị khóa.
          </p>
        </div>
      </div>
      <ShiftConfirmPanel closing={closing} onApprove={approveShift} onConfirm={confirmShift} onUnlock={unlockShift} />
      <ShiftReportTable report={closing?.report || report} />
    </section>
  )
}

export default ShiftSummaryPage
