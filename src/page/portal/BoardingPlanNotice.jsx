import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { useKitchenData } from "../../hooks/useKitchenData";

const mealNames = {
  BREAKFAST: "Bữa sáng",
  LUNCH: "Bữa trưa",
  AFTERNOON: "Bữa xế",
  DINNER: "Bữa tối",
};
const formatQuantity = (quantity) => Number(quantity).toLocaleString("vi-VN");

export default function BoardingPlanNotice({ date }) {
  const { session } = useAuth();
  const enabled = session.userType === "HEAD_CHEF";
  const state = useKitchenData(
    "/kitchen/meal-plans",
    { date, includePlannedItems: true },
    enabled,
  );
  if (!enabled) return null;
  const plans = (Array.isArray(state.data) ? state.data : []).filter(
    (plan) => plan.status === "DRAFT" && plan.plannedItems?.length > 0,
  );
  return (
    <section
      aria-label="Thông báo kế hoạch bán trú chờ tiếp nhận"
      aria-live="polite"
      className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-5"
    >
      <h2 className="flex items-center gap-2 font-bold text-blue-950">
        <Bell size={20} aria-hidden="true" />
        Kế hoạch bán trú chờ tiếp nhận
        {state.data && (
          <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-sm text-white">
            {plans.length}
          </span>
        )}
      </h2>
      {state.loading && <p role="status" className="text-sm text-blue-800">Đang kiểm tra kế hoạch bán trú…</p>}
      {state.error && (
        <p role="alert" className="text-sm text-red-700">
          Không tải được thông báo kế hoạch. {state.error}{" "}
          <button type="button" onClick={state.reload} className="font-semibold underline">Thử lại</button>
        </p>
      )}
      {!state.loading && !state.error && !plans.length && (
        <p className="text-sm text-slate-600">Không có kế hoạch bán trú chờ tiếp nhận trong ngày đã chọn.</p>
      )}
      {plans.map((plan) => (
        <article key={plan.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-4">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-950">
              {mealNames[plan.mealPeriod] || plan.mealPeriod} · {plan.planDate.split("-").reverse().join("/")}
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {plan.plannedItems.map((item) => (
                <li key={item.id}>
                  {item.productName} · {item.level === "preschool" ? "Mầm non" : item.level === "primary" ? "Tiểu học" : item.level} · <strong>{formatQuantity(item.expectedQuantity)} suất dự kiến</strong>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-blue-700">Admin đã lập kế hoạch. Bếp trưởng cần tiếp nhận để tạo mẻ chế biến.</p>
          </div>
          <Link
            to={`/dashboard/kitchen-plan/boarding?date=${encodeURIComponent(plan.planDate)}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            aria-label={`Xem kế hoạch ${mealNames[plan.mealPeriod] || plan.mealPeriod} ngày ${plan.planDate}`}
          >
            Xem & tiếp nhận kế hoạch
          </Link>
        </article>
      ))}
      <p className="text-xs text-slate-500">Theo ngày tổng quan đã chọn. Thông báo cập nhật khi mở màn hình hoặc nhấn Làm mới và tự hết chờ khi kế hoạch đã được tiếp nhận.</p>
    </section>
  );
}
