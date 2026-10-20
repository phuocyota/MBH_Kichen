import { useState } from "react";
import { api } from "../../api/kitchenApi";
import { useAuth } from "../../auth/authContext";
import { useCatalog } from "./portalHelpers";
import { Dialog, Field, inputClass } from "./PortalUI";
import RecipeQuickEntry from "./RecipeQuickEntry.jsx";
import { createRecipeSubmission } from "./recipeSubmission.js";

export default function RecipeFormDialog({
  dialog = {},
  productId = "",
  onClose,
  onSaved,
}) {
  const { branchId } = useAuth();
  const catalog = useCatalog(["products", "units"]);
  const [saveRecipe] = useState(() => createRecipeSubmission(api));
  return (
    <Dialog
      key={dialog.id || dialog.productId || productId || "new"}
      title={dialog.id ? "Tạo phiên bản công thức mới" : "Thêm công thức"}
      onClose={onClose}
      submitActions={[
        { value: "draft", label: "Lưu nháp", className: "rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 disabled:opacity-40" },
        { value: "submit", label: "Gửi duyệt" },
      ]}
      initial={{
        productId: dialog.productId || productId,
        description: dialog.description || "",
        yieldQuantity: Number(dialog.yieldQuantity || 1),
        yieldUnitId: dialog.yieldUnitId || "",
        items: dialog.items?.map((item) => ({
          ingredientProductId: item.ingredientProductId,
          quantity: Number(item.quantity),
          unitId: item.unitId,
        })) || [{}],
        expectedWastePercent: Number(dialog.expectedWastePercent || 0),
      }}
      onSubmit={async (value, action) => {
        if (value.description.length > 500)
          throw new Error("Mô tả tối đa 500 ký tự.");
        if (!value.items.length)
          throw new Error("Cần ít nhất một nguyên liệu.");
        if (
          new Set(value.items.map((item) => item.ingredientProductId))
            .size !== value.items.length
        )
          throw new Error("Mỗi nguyên liệu chỉ khai báo một lần.");
        const body = {
          branchId,
          productId: value.productId,
          description: value.description,
          yieldQuantity: Number(value.yieldQuantity),
          yieldUnitId: value.yieldUnitId,
          expectedWastePercent: Number(value.expectedWastePercent),
          items: value.items.map((item) => ({
            ingredientProductId: item.ingredientProductId,
            quantity: Number(item.quantity),
            unitId: item.unitId,
          })),
        };
        try {
          await saveRecipe(body, action);
        } finally {
          await onSaved?.();
          window.dispatchEvent(new Event("kitchen:recipe-requests"));
        }
      }}
    >
      {(value, change) => (
        <>
          <Field
            label="Món thành phẩm"
            options={catalog.products.filter(
              (product) => product.productType === "FINISHED_GOOD",
            )}
            value={value.productId}
            onChange={(id) => change("productId", id)}
          />
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Giới thiệu thành phần
            <textarea
              className={inputClass}
              rows={3}
              maxLength={500}
              value={value.description}
              placeholder="Ví dụ: Bánh mì gồm vỏ bánh giòn, chả và rau tươi."
              onChange={(e) => change("description", e.target.value)}
            />
            <span className="text-xs font-normal text-slate-400">
              {value.description.length}/500 ký tự
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Sản lượng đầu ra"
              type="number"
              min="0.001"
              step="0.001"
              value={value.yieldQuantity}
              onChange={(quantity) => change("yieldQuantity", quantity)}
            />
            <Field
              label="Đơn vị thành phẩm"
              options={catalog.units}
              value={value.yieldUnitId}
              onChange={(id) => change("yieldUnitId", id)}
            />
          </div>
          <h3 className="font-bold">Nguyên liệu & Định lượng</h3>
          <RecipeQuickEntry catalog={catalog} onApply={(items) => change("items", items)} />
          {value.items.map((item, index) => {
            const update = (key, next) =>
              change(
                "items",
                value.items.map((line, i) =>
                  i === index ? { ...line, [key]: next } : line,
                ),
              );
            return (
              <fieldset
                key={index}
                className="grid gap-3 rounded-xl border border-blue-100 p-4"
              >
                <legend className="px-1 text-sm text-slate-500">
                  Thành phần {index + 1}
                </legend>
                <Field
                  label="Nguyên liệu"
                  options={catalog.products.filter(
                    (product) => product.productType === "INGREDIENT",
                  )}
                  value={item.ingredientProductId}
                  onChange={(id) => update("ingredientProductId", id)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Lượng dùng"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={item.quantity}
                    onChange={(quantity) => update("quantity", quantity)}
                  />
                  <Field
                    label="Đơn vị nguyên liệu"
                    options={catalog.units}
                    value={item.unitId}
                    onChange={(id) => update("unitId", id)}
                  />
                </div>
                <button
                  type="button"
                  className="justify-self-start text-sm text-red-600"
                  onClick={() =>
                    change(
                      "items",
                      value.items.filter((_, i) => i !== index),
                    )
                  }
                >
                  Bỏ thành phần
                </button>
              </fieldset>
            );
          })}
          <button
            type="button"
            className="justify-self-start rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600"
            onClick={() => change("items", [...value.items, {}])}
          >
            + Thêm nguyên liệu
          </button>
          <Field
            label="Hao hụt dự kiến (%)"
            type="number"
            min="0"
            max="99.99"
            step="0.01"
            value={value.expectedWastePercent}
            onChange={(value) => change("expectedWastePercent", value)}
          />
          <p className="text-sm text-slate-500">
            Định lượng là lượng nguyên liệu đầu vào đã bao gồm hao hụt dự
            kiến. Lưu nháp để tiếp tục sau, hoặc gửi duyệt để quản trị kiểm tra.
          </p>
        </>
      )}
    </Dialog>
  );
}
