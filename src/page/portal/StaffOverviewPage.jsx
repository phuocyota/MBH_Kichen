import RecipeRequestInbox from "./RecipeRequestInbox";
import BoardingPlanNotice from "./BoardingPlanNotice";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  RefreshCw,
} from "lucide-react";
import { useKitchenData } from "../../hooks/useKitchenData";
import { today } from "./portalHelpers";
import { api } from "../../api/kitchenApi";
import { useAuth } from "../../auth/authContext";
import { withDate } from "./routeFilters";

const stages = {
  WAITING: {
    label: "Chưa bắt đầu",
    step: 0,
    color: "bg-slate-100 text-slate-600",
    bar: "bg-slate-300",
  },
  PREPARING: {
    label: "Đang chế biến",
    step: 1,
    color: "bg-blue-50 text-blue-700",
    bar: "bg-blue-600",
  },
  READY: {
    label: "Sẵn sàng",
    step: 2,
    color: "bg-amber-50 text-amber-700",
    bar: "bg-amber-500",
  },
  COMPLETED: {
    label: "Hoàn thành",
    step: 3,
    color: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
  },
  DELIVERED: {
    label: "Đã giao",
    step: 3,
    color: "bg-emerald-50 text-emerald-700",
    bar: "bg-emerald-500",
  },
};
const number = (value) =>
  Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 4 });
export default function StaffOverviewPage() {
  const [date, setDate] = useState(today);
  const state = useKitchenData("/kitchen/staff-overview", { date });
  const data = state.data;
  const { branchId } = useAuth();
  const [requestState, setRequestState] = useState({});
  const [retryRequest, setRetryRequest] = useState(0);
  const requestScope = JSON.stringify([branchId, date, data?.shortages]);
  useEffect(() => {
    if (!data || date !== today()) return;
    let disposed = false;
    api.create("/kitchen/shortage-requests", { branchId, date })
      .then((result) => {
        if (!disposed) setRequestState({ scope: requestScope, count: result.count, error: "" });
      })
      .catch((error) => {
        if (!disposed) setRequestState({ scope: requestScope, error: error.message });
      });
    return () => { disposed = true; };
  }, [data, date, branchId, requestScope, retryRequest]);
  const shortageRequest = requestState.scope === requestScope ? requestState : null;
  const dateLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(`${date}T12:00:00+07:00`));
  const cards = data
    ? [
        {
          label: "Suất món theo kế hoạch",
          value: number(data.portionQuantity),
          detail: `${number(data.planCount)} kế hoạch · tổng số lượng từng món`,
          to: "/dashboard/kitchen-plan/boarding",
        },
        {
          label: "Món cần chế biến",
          value: number(data.dishCount),
          detail: `${number(data.inProgressCount)} công việc đang thực hiện`,
          to: "/dashboard/cooking/tracking",
        },
        {
          label: "Nguyên liệu thiếu",
          value: number(data.shortages.length),
          detail: data.shortages.length
            ? "Cần xử lý"
            : "Không có thiếu hụt theo định mức",
          to: "/dashboard/materials/consumption",
          danger: data.shortages.length > 0,
        },
        {
          label: "Công việc hoàn thành",
          value: `${number(data.completedCount)}/${number(data.taskCount)}`,
          detail: `${number(data.taskCount - data.completedCount)} công việc còn lại`,
          to: "/dashboard/cooking/tracking?status=COMPLETED,HANDED_OVER",
        },
      ]
    : [];
  return (
    <section className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-blue-600">
            Công việc của bạn
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Tổng quan bếp
          </h1>
          <p className="mt-2 capitalize text-slate-500">{dateLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to={withDate('/dashboard/cooking/tickets', date)}
            className="rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            Đơn căn tin
          </Link>
          <input
            aria-label="Ngày tổng quan"
            type="date"
            required
            value={date}
            onChange={(e) => {
              if (e.target.value) setDate(e.target.value);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          />
          <button
            onClick={() => window.dispatchEvent(new Event("kitchen:reload"))}
            disabled={state.loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      </header>
      <BoardingPlanNotice date={date} />
      <RecipeRequestInbox />
      {state.loading && (
        <p role="status" className="text-sm text-slate-500">
          Đang tải công việc bếp…
        </p>
      )}
      {state.error && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          Không tải được tổng quan bếp. {state.error}{" "}
          <button onClick={state.reload} className="font-semibold underline">
            Thử lại
          </button>
        </div>
      )}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.label}
                to={withDate(card.to, date)}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-500">
                    {card.label}
                  </p>
                  <ArrowUpRight
                    size={17}
                    className="text-slate-300 group-hover:text-blue-600"
                  />
                </div>
                <p
                  className={`mt-5 text-4xl font-bold tracking-tight ${card.danger ? "text-red-600" : "text-slate-950"}`}
                >
                  {card.value}
                </p>
                <p className="mt-3 text-xs leading-relaxed text-slate-500">
                  {card.detail}
                </p>
              </Link>
            ))}
          </div>
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-950">
                Kế hoạch chế biến{date === today() ? " hôm nay" : ""}
              </h2>
              <Link
                to={withDate('/dashboard/cooking/tracking', date)}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                Xem chế biến →
              </Link>
            </div>
            <div className="space-y-3">
              {data.batches.map((batch) => {
                const stage = stages[batch.status] || {
                  label: batch.status,
                  step: 0,
                  color: "bg-slate-100 text-slate-600",
                  bar: "bg-slate-300",
                };
                return (
                  <Link
                    key={batch.id}
                    to={withDate(`/dashboard/kitchen/tasks?type=batch&id=${batch.id}`, date)}
                    className="block rounded-xl border border-slate-200 p-5 transition hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-950">
                          {batch.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {number(batch.quantity)} {batch.unit} · {batch.shift}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${stage.color}`}
                      >
                        {stage.label}
                      </span>
                    </div>
                    <div
                      aria-label={`Tiến độ ${batch.name}: ${stage.label}`}
                      className="mt-4 flex gap-1.5"
                    >
                      {[1, 2, 3].map((step) => (
                        <span
                          key={step}
                          className={`h-1.5 flex-1 rounded-full ${step <= stage.step ? stage.bar : "bg-slate-100"}`}
                        />
                      ))}
                    </div>
                  </Link>
                );
              })}
              {!data.batches.length && (
                <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Chưa có mẻ chế biến trong ngày đã chọn.
                </p>
              )}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Các bước: Đang chế biến → Sẵn sàng → Hoàn thành.
            </p>
          </section>
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-950">
                Đơn căn tin trong ngày
              </h2>
              <Link
                to={withDate('/dashboard/cooking/tickets', date)}
                className="text-sm font-semibold text-blue-600 hover:underline"
              >
                Xem đơn căn tin →
              </Link>
            </div>
            <div className="space-y-3">
              {(data.tickets || []).map((ticket) => (
                <Link
                  key={ticket.id}
                  to={withDate(`/dashboard/kitchen/tasks?type=ticket&id=${ticket.id}`, date)}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-5 hover:border-blue-300"
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      Đơn {ticket.orderNumber || ticket.orderCode}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {ticket.items
                        .map(
                          (item) => `${item.name} × ${number(item.quantity)}`,
                        )
                        .join(", ")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${stages[ticket.status]?.color || "bg-slate-100 text-slate-600"}`}
                  >
                    {stages[ticket.status]?.label || ticket.status}
                  </span>
                </Link>
              ))}
              {!data.tickets?.length && (
                <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  Chưa có đơn căn tin đã thanh toán trong ngày đã chọn.
                </p>
              )}
            </div>
          </section>
          <section>
            <h2 className="mb-4 text-xl font-bold text-slate-950">
              Cần xử lý ngay
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              Thiếu nguyên liệu được đối chiếu theo kế hoạch và tồn còn hạn; chỉ
              tính các món đã có công thức.
            </p>
            {date === today() && data.shortages.length > 0 && (
              <p role={shortageRequest?.error ? "alert" : "status"} className={`mb-4 rounded-xl p-3 text-sm ${shortageRequest?.error ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                {shortageRequest?.error ? <>Chưa gửi được yêu cầu bổ sung: {shortageRequest.error} <button type="button" className="font-semibold underline" onClick={() => setRetryRequest((value) => value + 1)}>Gửi lại</button></> : shortageRequest ? `Đã gửi yêu cầu bổ sung ${shortageRequest.count} nguyên liệu đến Admin/Quản lý chi nhánh.` : "Đang gửi yêu cầu bổ sung nguyên liệu đến Admin/Quản lý…"}
              </p>
            )}
            <div className="space-y-3">
              {data.shortages.map((line) => (
                <Link
                  key={line.productId}
                  to={withDate('/dashboard/materials/consumption', date)}
                  className="flex items-center gap-4 rounded-2xl border border-red-100 bg-white p-5 shadow-sm hover:bg-red-50"
                >
                  <AlertTriangle size={22} className="shrink-0 text-red-500" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-950">
                      Thiếu {number(line.shortageQuantity)} {line.unit}{" "}
                      {line.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Nhu cầu theo định mức vượt lượng tồn còn hạn.
                    </p>
                  </div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                    Cần bổ sung
                  </span>
                </Link>
              ))}
              {data.missingSampleCount > 0 && (
                <Link
                  to={withDate('/dashboard/samples/manage', date)}
                  className="flex items-center gap-4 rounded-2xl border border-orange-100 bg-white p-5 shadow-sm hover:bg-orange-50"
                >
                  <ClipboardList
                    size={22}
                    className="shrink-0 text-orange-500"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-950">
                      {number(data.missingSampleCount)} mẻ chưa lưu mẫu hợp lệ
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Cần lưu mẫu theo quy trình chế biến.
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                    Chờ xử lý
                  </span>
                </Link>
              )}
              {!data.shortages.length && !data.missingSampleCount && (
                <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm text-emerald-700">
                  Không có cảnh báo thiếu nguyên liệu hoặc thiếu mẫu lưu trong
                  ngày đã chọn.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
