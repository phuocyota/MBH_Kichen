import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useKitchenData } from "../../hooks/useKitchenData";
import { useAuth } from "../../auth/authContext";
import RecipeFormDialog from "./RecipeFormDialog";
import { api } from "../../api/kitchenApi";
import { Link } from "react-router-dom";
import { pendingRecipeRequests } from "./recipeRequestStatus";

export default function RecipeRequestInbox({ productId = "" }) {
  const { session } = useAuth();
  const [request, setRequest] = useState(null);
  const [opening, setOpening] = useState(null);
  const [openError, setOpenError] = useState("");
  const enabled = session.userType === "HEAD_CHEF";
  const state = useKitchenData(
    "/kitchen/recipe-requests",
    { productId },
    enabled,
  );
  const reloadRequests = state.reload;
  async function openRequest(row) {
    if (opening) return;
    setOpenError("");
    if (row.status === "OPEN") { setRequest(row); return; }
    setOpening(row.id);
    try {
      const data = await api.list("/kitchen/recipes", { productId: row.productId });
      const recipes = Array.isArray(data) ? data : data?.data || [];
      const recipe = recipes.find((item) => item.id === row.recipeId);
      if (!recipe) throw new Error("Không tìm thấy công thức. Hãy làm mới yêu cầu.");
      setRequest({ ...row, recipe });
    } catch (err) { setOpenError(err.message); }
    finally { setOpening(null); }
  }
  useEffect(() => {
    if (!enabled) return;
    const reload = () => reloadRequests();
    window.addEventListener("kitchen:recipe-requests", reload);
    return () => window.removeEventListener("kitchen:recipe-requests", reload);
  }, [enabled, reloadRequests]);
  if (!enabled) return null;
  const rows = pendingRecipeRequests(state.data);
  return (
    <section
      aria-label="Thông báo công thức và định lượng"
      className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-bold text-amber-900">
          <Bell size={18} />
          Công thức & định lượng cần theo dõi {state.data && `(${rows.length})`}
        </h2>
        <button
          type="button"
          disabled={state.loading}
          className="text-sm font-semibold text-blue-600 underline"
          onClick={state.reload}
        >
          Làm mới yêu cầu
        </button>
      </div>
      {state.loading && (
        <p role="status" className="text-sm">
          Đang tải yêu cầu công thức…
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {openError && <p role="alert" className="text-sm text-red-600">{openError}</p>}
      {!state.loading && !state.error && !rows.length && (
        <p className="text-sm text-slate-600">
          Không có yêu cầu công thức đang chờ xử lý.
        </p>
      )}
      {rows.map((row) => (
        <article key={row.id} className="rounded-xl bg-white p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <h3 className="font-semibold">{row.productName}</h3>
            <span className="text-xs text-amber-700">
              {row.status === "OPEN"
                ? "Chờ tạo công thức"
                : row.status === "SUBMITTED"
                  ? "Đã gửi duyệt · Chờ Admin/Quản lý"
                : row.status === "REVISION_REQUESTED"
                  ? "Quản trị yêu cầu chỉnh sửa"
                  : "Đã có bản nháp · cần gửi duyệt"}
            </span>
          </div>
          <p className="mt-2 text-slate-700">{row.note}</p>
          {row.batchCount > 0 && <p className="mt-2 text-sm font-medium text-orange-700">{row.batchCount} mẻ đang chờ công thức được duyệt{row.productionDate ? ` · Từ ngày ${row.productionDate.split('-').reverse().join('/')}` : ''}.</p>}
          {row.revisionReason && (
            <p className="mt-2 rounded-lg bg-orange-50 p-3 text-orange-800">
              Nội dung cần chỉnh sửa: {row.revisionReason}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            {row.requestedByName} ·{" "}
            {new Date(row.reviewedAt || row.createdAt).toLocaleString("vi-VN")}
          </p>
            {row.status === 'SUBMITTED' ? (
              <Link className="mt-3 inline-block font-semibold text-blue-600 underline" to={`/dashboard/menu/recipes?productId=${encodeURIComponent(row.productId)}`}>Xem công thức chờ duyệt</Link>
            ) : <button
              type="button"
              disabled={Boolean(opening)}
              className="mt-3 inline-block font-semibold text-blue-600 underline"
              onClick={() => openRequest(row)}
            >
              {opening === row.id ? "Đang mở công thức…" : row.status === "OPEN"
                ? "Thiết lập công thức & định lượng"
                : row.status === "REVISION_REQUESTED" ? "Chỉnh sửa công thức & gửi lại" : "Mở bản nháp để gửi duyệt"}
            </button>}
        </article>
      ))}
      {request && (
        <RecipeFormDialog
          key={request.id}
          productId={request.productId}
          dialog={request.recipe || {}}
          onClose={() => setRequest(null)}
          onSaved={() => window.dispatchEvent(new Event("kitchen:reload"))}
        />
      )}
      <p className="text-xs text-slate-500">
        Yêu cầu cập nhật khi mở màn hình hoặc nhấn Làm mới; không tự làm mới.
      </p>
    </section>
  );
}
