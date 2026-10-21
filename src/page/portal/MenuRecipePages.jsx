import RecipeRequestInbox from "./RecipeRequestInbox";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../../api/kitchenApi";
import { useKitchenData } from "../../hooks/useKitchenData";
import { useAuth } from "../../auth/authContext";
import RecipeFormDialog from "./RecipeFormDialog";
import {
  ActionButton,
  Field,
  PageFrame,
  Pagination,
  Table,
  buttonClass,
} from "./PortalUI";

export function DishesPage() {
  const [query, setQuery] = useState({ page: 1, size: 20, search: "" });
  const state = useKitchenData("/products", {
    ...query,
    productType: "FINISHED_GOOD",
  });
  return (
    <PageFrame
      title="Danh mục món ăn"
      description="Món thành phẩm được khai báo bên quản trị. Thiết lập thành phần và định mức cho từng món tại đây."
      state={state}
    >
      <Field
        label="Tìm món ăn"
        required={false}
        value={query.search}
        onChange={(search) => setQuery({ ...query, search, page: 1 })}
      />
      <Table
        rows={state.data?.data || []}
        columns={[
          ["code", "Mã món"],
          ["name", "Tên món"],
          ["unit", "Đơn vị"],
          [
            "price",
            "Giá bán",
            (row) => `${Number(row.price || 0).toLocaleString("vi-VN")}đ`,
          ],
          [
            "isActive",
            "Trạng thái",
            (row) => (row.isActive === false ? "Ngừng hoạt động" : "Hoạt động"),
          ],
        ]}
        actions={(row) => (
          <Link
            className="font-semibold text-blue-600 hover:underline"
            to={`/dashboard/menu/recipes?productId=${encodeURIComponent(row.id)}`}
          >
            Công thức & Định lượng
          </Link>
        )}
      />
      <Pagination data={state.data} query={query} setQuery={setQuery} />
    </PageFrame>
  );
}

export function RecipesPage() {
  const { session } = useAuth();
  const canEdit = session.userType === "HEAD_CHEF";
  const [search, setSearch] = useSearchParams();
  const productId = search.get("productId") || "";
  const [dialog, setDialog] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const state = useKitchenData("/kitchen/recipes", { productId });
  const rows = Array.isArray(state.data) ? state.data : state.data?.data || [];
  const selected = rows.find((row) => row.id === expanded);
  async function submitForReview(row) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await api.action("/kitchen/recipes", row.id, "submit", {});
      await state.reload();
      window.dispatchEvent(new Event("kitchen:recipe-requests"));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageFrame
      title="Công thức & Định lượng"
      description="Bếp trưởng tạo công thức và gửi duyệt. Admin hoặc quản lý chi nhánh phê duyệt trên Web Admin; chỉ công thức đã duyệt được dùng cho chế biến."
      state={state}
      action={
        canEdit && (
          <button className={buttonClass} onClick={() => setDialog({})}>
            Thêm công thức
          </button>
        )
      }
    >
      <RecipeRequestInbox productId={productId} />
      {productId && (
        <button
          className="text-sm font-semibold text-blue-600 underline"
          onClick={() => setSearch({})}
        >
          Xem công thức tất cả món
        </button>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      <Table
        rows={rows}
        columns={[
          ["product", "Món ăn", (row) => row.product?.name || row.productId],
          [
            "description",
            "Giới thiệu thành phần",
            (row) => row.description || "Chưa mô tả",
          ],
          ["version", "Phiên bản"],
          [
            "yieldQuantity",
            "Sản lượng công thức",
            (row) =>
              `${Number(row.yieldQuantity)} ${row.yieldUnit?.code || ""}`,
          ],
          [
            "status",
            "Trạng thái",
            (row) =>
              ({
                ACTIVE: "Đang áp dụng",
                DRAFT: "Bản nháp",
                PENDING_REVIEW: "Chờ admin duyệt",
                REVISION_REQUESTED: "Cần chỉnh sửa",
                INACTIVE: "Ngừng áp dụng",
              })[row.status] || row.status,
          ],
        ]}
        actions={(row) => (
          <>
            <ActionButton
              onClick={() => setExpanded(expanded === row.id ? null : row.id)}
            >
              Xem định mức
            </ActionButton>
            {canEdit && (
              <ActionButton onClick={() => setDialog(row)}>
                Chỉnh sửa công thức
              </ActionButton>
            )}
            {canEdit &&
              ["DRAFT", "REVISION_REQUESTED"].includes(row.status) &&
              idOwn(row, session) && (
                <ActionButton
                  disabled={busy}
                  onClick={() => submitForReview(row)}
                >
                  Gửi duyệt
                </ActionButton>
              )}
          </>
        )}
      />
      {selected && (
        <section className="rounded-2xl border border-blue-100 bg-white p-5">
          <h2 className="mb-2 text-lg font-bold">
            {selected.product?.name || "Công thức"} · phiên bản{" "}
            {selected.version}
          </h2>
          {selected.approval?.reason && (
            <p className="mb-4 rounded-xl bg-orange-50 p-3 text-orange-800">
              Admin yêu cầu sửa: {selected.approval.reason}
            </p>
          )}
          {selected.description && (
            <p className="mb-4 text-sm text-slate-600">
              {selected.description}
            </p>
          )}
          <Table
            rows={selected.items || []}
            columns={[
              [
                "ingredient",
                "Nguyên liệu",
                (row) => row.ingredientProduct?.name || row.ingredientProductId,
              ],
              ["quantity", "Định lượng", (row) => Number(row.quantity)],
              ["unit", "Đơn vị", (row) => row.unit?.code || row.unitId],
            ]}
          />
          <p className="mt-3 text-sm text-slate-500">
            Định mức cho {Number(selected.yieldQuantity)}{" "}
            {selected.yieldUnit?.code || "đơn vị"} thành phẩm. Lô thực dùng được
            chọn khi chế biến.
          </p>
        </section>
      )}
      {dialog && (
        <RecipeFormDialog
          key={dialog.id || dialog.productId || productId || "new"}
          dialog={dialog}
          productId={productId}
          onClose={() => setDialog(null)}
          onSaved={state.reload}
        />
      )}
    </PageFrame>
  );
}

function idOwn(row, session) {
  return row.createdBy === session.userId;
}
