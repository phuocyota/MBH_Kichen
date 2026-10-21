import { useMemo, useState } from "react";
import { parseRecipeIngredients } from "./parseRecipeIngredients.js";
import { inputClass } from "./PortalUI";

export default function RecipeQuickEntry({ catalog, onApply }) {
  const [text, setText] = useState("");
  const [applied, setApplied] = useState(false);
  const lines = useMemo(
    () => parseRecipeIngredients(text, catalog.products, catalog.units),
    [text, catalog.products, catalog.units],
  );
  const canApply = !catalog.loading && !catalog.error && lines.length > 0 && lines.every((line) => line.item);
  return (
    <section aria-label="Nhập nhanh nguyên liệu" className="grid gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Nhập nhanh nguyên liệu
        <textarea
          className={inputClass}
          rows={2}
          value={text}
          placeholder="1 bánh mì không, 60g chả, 20g rau"
          onChange={(e) => { setText(e.target.value); setApplied(false); }}
        />
      </label>
      <p className="text-xs text-slate-600">
        Ngăn cách bằng dấu phẩy, chấm phẩy hoặc xuống dòng. Không ghi đơn vị sẽ dùng đơn vị tồn chuẩn của nguyên liệu. Dùng tên đầy đủ hoặc mã nếu có nhiều kết quả.
      </p>
      {catalog.loading ? <p role="status" className="text-sm">Đang tải danh mục nguyên liệu và đơn vị…</p> : catalog.error ? <p role="alert" className="text-sm text-red-600">{catalog.error}</p> : (
        <ul className="space-y-1 text-sm" aria-live="polite">
          {lines.map((line, index) => (
            <li key={index} className={line.error ? "text-red-600" : "text-slate-700"}>
              {line.error ? `${line.source}: ${line.error}` : `${line.productName} · ${line.item.quantity} ${line.unitLabel}`}
            </li>
          ))}
        </ul>
      )}
      <button type="button" disabled={!canApply} className="justify-self-start rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 disabled:opacity-40" onClick={() => { onApply(lines.map((line) => line.item)); setApplied(true); }}>
        Áp dụng {canApply ? lines.length : ""} thành phần
      </button>
      <p role="status" className="text-xs text-slate-600">
        {applied ? "Đã điền các thành phần bên dưới. Kiểm tra lại trước khi lưu." : "Áp dụng sẽ thay thế danh sách thành phần bên dưới; công thức chỉ được lưu khi nhấn Lưu."}
      </p>
    </section>
  );
}
