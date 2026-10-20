const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const aliases = {
  g: ["g", "gr", "gram", "gam"],
  kg: ["kg", "kilogram", "kilogam"],
  ml: ["ml", "milliliter", "mililit"],
  l: ["l", "liter", "lit"],
};
const unitKey = (value) => {
  const name = normalize(value);
  return Object.keys(aliases).find((key) => aliases[key].includes(name)) || name;
};

function findProducts(name, products) {
  const key = normalize(name);
  const exact = products.filter(
    (p) => normalize(p.name) === key || normalize(p.code) === key,
  );
  return exact.length
    ? exact
    : products.filter((p) => ` ${normalize(p.name)} `.includes(` ${key} `));
}

// Only resolve existing catalog IDs; ambiguous input never becomes a recipe item.
export function parseRecipeIngredients(text, products, units) {
  const ingredients = products.filter(
    (p) => p.productType === "INGREDIENT" && p.isActive !== false,
  );
  const activeUnits = units.filter((u) => u.isActive !== false);
  const seen = new Set();
  return text
    // A decimal comma belongs to the leading quantity, never to a product code.
    .replace(/(^|[,;\n])(\s*\d+),(\d+)(?=\s*[^\d,;\n])/g, "$1$2.$3")
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((source) => {
      try {
        const match = source.match(/^(\d+(?:[.,]\d+)?)\s*(.+)$/);
        if (!match) throw Error("Nhập số lượng trước tên nguyên liệu.");
        const quantity = Number(match[1].replace(",", "."));
        if (!Number.isFinite(quantity) || quantity < 0.0001)
          throw Error("Số lượng phải từ 0,0001 trở lên.");
        let name = match[2].trim();
        let unitCandidates = [];
        const exactName = ingredients.some(
          (p) => normalize(p.name) === normalize(name) || normalize(p.code) === normalize(name),
        );
        if (!exactName) {
          const token = name.match(/^(\S+)\s+(.+)$/);
          if (token) {
            const exactUnits = activeUnits.filter((u) => normalize(u.code) === normalize(token[1]));
            unitCandidates = exactUnits.length ? exactUnits : activeUnits.filter((u) =>
              [u.code, u.name].some((label) => unitKey(label) === unitKey(token[1])),
            );
            if (unitCandidates.length) name = token[2].trim();
          }
        }
        const candidates = findProducts(name, ingredients);
        if (!candidates.length) throw Error(`Không tìm thấy nguyên liệu “${name}”.`);
        if (candidates.length > 1)
          throw Error(`Tên chưa rõ: ${candidates.map((p) => p.name).join(", ")}. Hãy nhập tên đầy đủ hoặc mã nguyên liệu.`);
        const product = candidates[0];
        const baseUnit = activeUnits.find((u) => u.id === product.baseUnitId);
        if (!baseUnit) throw Error(`“${product.name}” chưa có đơn vị tồn chuẩn hợp lệ.`);
        const compatible = unitCandidates.filter((u) => u.dimension === baseUnit.dimension);
        if (unitCandidates.length && !compatible.length)
          throw Error(`Đơn vị không tương thích với “${product.name}” (${baseUnit.code}).`);
        if (compatible.length > 1) throw Error("Đơn vị chưa rõ. Hãy nhập đúng mã đơn vị trong danh mục.");
        const unit = compatible[0] || baseUnit;
        if (seen.has(product.id)) throw Error(`“${product.name}” bị lặp. Hãy gộp thành một thành phần.`);
        seen.add(product.id);
        return {
          source,
          productName: product.name,
          unitLabel: unit.code || unit.name,
          item: { ingredientProductId: product.id, quantity, unitId: unit.id },
        };
      } catch (error) {
        return { source, error: error.message };
      }
    });
}
