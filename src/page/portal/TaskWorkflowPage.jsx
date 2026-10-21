import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Check,
  ClipboardList,
  PackageCheck,
} from "lucide-react";
import { api } from "../../api/kitchenApi";
import { useKitchenData } from "../../hooks/useKitchenData";
import { useAuth } from "../../auth/authContext";
import { today } from "./portalHelpers";
import { Field, PageFrame, Table, buttonClass } from "./PortalUI";

const statuses = {
  WAITING: "Chờ nhận",
  RECEIVED: "Đã nhận nguyên liệu",
  PREPARING: "Đang chế biến",
  RECORDED: "Đã ghi thực tế",
  COMPLETED: "Chờ bàn giao",
  HANDED_OVER: "Đã bàn giao",
  LEGACY: "Cần xác nhận nguyên liệu",
};
const actionLabels = {
  migrate: "Tiếp nhận nhiệm vụ theo quy trình mới",
  wait: "Chờ bổ sung nguyên liệu",
  receive: "Xác nhận nhận nguyên liệu",
  start: "Bắt đầu chế biến",
  record: "Lưu thực tế",
  complete: "Kiểm tra và hoàn thành",
  handover: "Xác nhận bàn giao",
  "handover-partial": "Xác nhận bàn giao phần đã hoàn thành",
};
const steps = [
  "Nhận thông báo",
  "Xem nhiệm vụ",
  "Nhận nguyên liệu",
  "Bắt đầu chế biến",
  "Ghi nhận thực tế",
  "Kiểm tra & hoàn thành",
  "Bàn giao thành phẩm",
];
const format = (value) =>
  Number(value || 0).toLocaleString("vi-VN", { maximumFractionDigits: 4 });

export default function TaskWorkflowPage({ preset = "" }) {
  const [search, setSearch] = useSearchParams();
  const type = search.get("type") || preset;
  const id = search.get("id") || "";
  const [date, setDate] = useState(today);
  const [notificationError, setNotificationError] = useState("");
  const selected = Boolean(id && ["batch", "ticket"].includes(type));
  const list = useKitchenData(
    "/kitchen/tasks",
    { date, type: preset },
    !selected,
  );
  const detail = useKitchenData(`/kitchen/tasks/${type}/${id}`, {}, selected);
  const rows = Array.isArray(list.data) ? list.data : [];
  if (selected)
    return (
      <PageFrame
        title="Xử lý nhiệm vụ bếp"
        description="Thực hiện lần lượt, ghi nhận đúng nguyên liệu theo lô và bàn giao thành phẩm."
        state={detail}
      >
        <button
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
          onClick={() => setSearch({})}
        >
          <ArrowLeft size={16} />
          Danh sách nhiệm vụ
        </button>
        {detail.data && (
          <>
            {notificationError && (
              <p
                role="alert"
                className="rounded-xl bg-amber-50 p-4 text-amber-800"
              >
                {notificationError}{" "}
                <button
                  className="font-semibold underline"
                  onClick={async () => {
                    try {
                      await api.create("/kitchen/shortage-requests", {
                        branchId: detail.data.branchId,
                      });
                      setNotificationError("");
                    } catch (err) {
                      setNotificationError(err.message);
                    }
                  }}
                >
                  Gửi lại yêu cầu bổ sung
                </button>
              </p>
            )}
            <TaskDetail
              key={`${type}:${id}:${detail.data.version}`}
              task={detail.data}
              reload={detail.reload}
              onNotificationError={setNotificationError}
            />
          </>
        )}
      </PageFrame>
    );
  return (
    <PageFrame
      title={
        preset === "ticket"
          ? "Đơn căn tin · Nhiệm vụ bếp"
          : preset === "batch"
            ? "Mẻ chế biến · Nhiệm vụ bếp"
            : "Nhận việc & Chế biến"
      }
      description="Mở nhiệm vụ để xem công thức, nhận nguyên liệu, chế biến và bàn giao. Nhấn Làm mới để nhận danh sách mới nhất."
      state={list}
    >
      <div className="grid gap-4 rounded-2xl bg-white p-5 sm:grid-cols-[1fr_2fr]">
        <Field
          label="Ngày nhiệm vụ"
          type="date"
          value={date}
          onChange={(value) => {
            if (value) setDate(value);
          }}
        />
        <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-blue-700">
          <Bell size={22} />
          <span>
            <strong>
              {rows.filter((row) => row.status === "WAITING").length} nhiệm vụ
              chờ nhận
            </strong>
            <span className="mt-1 block text-xs">
              Thông báo dựa trên danh sách vừa tải; không tự làm mới.
            </span>
          </span>
        </div>
      </div>
      <Table
        rows={rows.map((row) => ({ ...row, key: `${row.type}:${row.id}` }))}
        columns={[
          [
            "type",
            "Nguồn",
            (row) =>
              row.type === "ticket" ? "Đơn căn tin" : "Kế hoạch chế biến",
          ],
          ["name", "Nhiệm vụ"],
          ["quantity", "Số lượng", (row) => format(row.quantity)],
          [
            "deadline",
            "Thời hạn",
            (row) =>
              row.deadline
                ? new Date(row.deadline).toLocaleString("vi-VN")
                : "Chưa thiết lập",
          ],
          [
            "ownerName",
            "Người thực hiện",
            (row) => row.ownerName || "Chưa nhận",
          ],
          ["status", "Trạng thái", (row) => statuses[row.status] || row.status],
        ]}
        actions={(row) => (
          <button
            className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-600"
            onClick={() => setSearch({ type: row.type, id: row.id })}
          >
            Xem nhiệm vụ
          </button>
        )}
      />
    </PageFrame>
  );
}

function TaskDetail({ task, reload, onNotificationError }) {
  const { session } = useAuth();
  const [allocations, setAllocations] = useState({});
  const [confirmUnissued, setConfirmUnissued] = useState(false);
  const mayMigrate = ["ADMIN", "MANAGER", "HEAD_CHEF"].includes(
    session.userType,
  );
  const [roundQuantities, setRoundQuantities] = useState(() =>
    Object.fromEntries(
      task.dishes.map((dish) => [
        dish.productId,
        task.type === "ticket" ? Math.min(10000, dish.quantity) : dish.quantity,
      ]),
    ),
  );
  const receivingDishes = task.dishes.map((dish) => ({
    ...dish,
    quantity: Number(roundQuantities[dish.productId] || 0),
    requirements: dish.requirements.map((line) => ({
      ...line,
      quantity: Number(
        (
          (line.quantity * Number(roundQuantities[dish.productId] || 0)) /
          dish.quantity
        ).toFixed(4),
      ),
    })),
  }));
  const applySuggestedRound = () => {
    setRoundQuantities(
      Object.fromEntries(
        task.suggestedRound.map((dish) => [dish.productId, dish.quantity]),
      ),
    );
    setAllocations(
      Object.fromEntries(
        task.suggestedRound.flatMap((dish) =>
          dish.inputLots.map((line) => [
            `${dish.productId}:${line.lotId}`,
            line.quantity,
          ]),
        ),
      ),
    );
  };
  const [actuals, setActuals] = useState(() =>
    task.actuals.length
      ? structuredClone(task.actuals)
      : task.received.map((entry) => ({
          batchId: entry.batchId,
          quantity:
            task.dishes.find((dish) => dish.productId === entry.productId)
              ?.quantity || 1,
          note: "",
          lots: entry.inputLots.map((line) => ({
            lotId: line.lotId,
            used: line.quantity,
            waste: 0,
          })),
        })),
  );
  const [samples, setSamples] = useState({});
  const [editingActuals, setEditingActuals] = useState(false);
  const [qualityPassed, setQualityPassed] = useState(false);
  const [receivedBy, setReceivedBy] = useState("");
  const [receiverPlace, setReceiverPlace] = useState(
    () =>
      task.handoverSuggestions?.defaultPlace ||
      (task.type === "ticket" ? "Quầy căn tin" : "Khu chia suất bán trú"),
  );
  const recipientSuggestions = task.handoverSuggestions?.recipients || [
    {
      name: task.type === "ticket" ? "Quầy căn tin" : "Bộ phận chia suất",
      source: "DEPARTMENT",
    },
  ];
  const placeSuggestions = task.handoverSuggestions?.places || [
    task.type === "ticket" ? "Quầy căn tin" : "Khu chia suất bán trú",
  ];
  const [confirmPartial, setConfirmPartial] = useState(false);
  const partialHandover =
    task.status === "WAITING" && (task.pendingHandover || []).length > 0;
  const handoverItems = partialHandover ? task.pendingHandover : task.actuals;
  const mayHandover =
    !partialHandover ||
    ["ADMIN", "MANAGER", "HEAD_CHEF"].includes(session.userType);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const mayAct =
    !task.ownerId ||
    task.ownerId === session.userId ||
    ["ADMIN", "MANAGER", "HEAD_CHEF"].includes(session.userType);
  const stage =
    {
      WAITING: 2,
      RECEIVED: 3,
      PREPARING: 4,
      RECORDED: 5,
      COMPLETED: 6,
      HANDED_OVER: 7,
    }[task.status] || 0;
  const mutate = async (action, body = {}) => {
    if (busy || !mayAct) return;
    setBusy(true);
    setError("");
    try {
      const result = await api.create(
        `/kitchen/tasks/${task.type}/${task.id}/${action}`,
        {
          ...body,
          expectedVersion: task.version,
          requestId: requestId.current,
        },
      );
      onNotificationError(result?.shortageNotificationError || "");
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const submit = (action, body) => (event) => {
    event.preventDefault();
    mutate(action, body());
  };
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-blue-100 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">{task.name}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {task.date} · {task.shift}
              {task.ownerName ? ` · ${task.ownerName}` : ""}
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            {task.waitingForStock && task.status === "WAITING"
              ? "Chờ bổ sung nguyên liệu"
              : statuses[task.status]}
          </span>
        </div>
        {task.deadline && (
          <p className="mt-2 text-sm text-orange-600">
            Thời hạn: {new Date(task.deadline).toLocaleString("vi-VN")}
          </p>
        )}
        {task.items?.length > 0 && (
          <p className="mt-3 text-sm text-slate-600">
            {task.items
              .map((item) => `${item.name} × ${format(item.quantity)}`)
              .join(", ")}
          </p>
        )}
      </header>
      {task.type === "ticket" && task.progress?.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="font-bold">Tiến độ toàn đơn</h3>
          {task.progress.map((dish) => (
            <p key={dish.productId}>
              {dish.name}:{" "}
              <strong>
                {format(dish.completedQuantity)}/{format(dish.quantity)} suất
                hoàn thành
              </strong>
              {dish.remainingQuantity > 0 &&
                ` · Còn ${format(dish.remainingQuantity)} suất`}
            </p>
          ))}
          <p className="text-sm text-slate-600">
            Mỗi đợt giữ nguyên định lượng công thức. Đơn chỉ hoàn tất khi đủ
            toàn bộ số suất. Bếp trưởng có thể xác nhận bàn giao riêng phần đã
            xong.
          </p>
        </section>
      )}
      <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
        {steps.map((step, index) => (
          <li
            key={step}
            className={`rounded-xl border p-3 text-xs font-medium ${index < stage ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-100 bg-white text-slate-400"}`}
          >
            <span className="mb-2 block text-lg font-bold">
              {index + 1 < stage || task.status === "HANDED_OVER" ? (
                <Check size={20} />
              ) : (
                index + 1
              )}
            </span>
            {step}
          </li>
        ))}
      </ol>
      {task.status === "LEGACY" && (
        <section
          role="alert"
          className="space-y-3 rounded-xl bg-amber-50 p-4 text-amber-800"
        >
          <h3 className="font-bold">Xác nhận nguyên liệu trước khi tiếp tục</h3>
          {task.migration?.allowed ? (
            <>
              <p>
                Nhiệm vụ đã được đánh dấu đang chế biến nhưng chưa có hồ sơ nhận
                nguyên liệu. Tiếp nhận để chọn lô theo FEFO, ghi nhận chế biến
                và bàn giao thành phẩm.
              </p>
              <label className="flex items-start gap-3 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={confirmUnissued}
                  disabled={busy || !mayMigrate}
                  onChange={(event) => setConfirmUnissued(event.target.checked)}
                />
                Tôi xác nhận nhiệm vụ chưa xuất nguyên liệu và chưa ghi nhận
                thành phẩm qua phiếu hoặc thao tác khác.
              </label>
              <button
                type="button"
                className={buttonClass}
                disabled={busy || !mayMigrate || !confirmUnissued}
                onClick={() => mutate("migrate", { confirmUnissued })}
              >
                Xác nhận & chọn nguyên liệu
              </button>
              {!mayMigrate && (
                <p className="text-sm">
                  Cần bếp trưởng hoặc quản lý xác nhận tiếp nhận.
                </p>
              )}
            </>
          ) : (
            <p>
              {task.migration?.reason ||
                "Cần quản lý đối chiếu hồ sơ nguyên liệu đã sử dụng trước khi xử lý tiếp."}
            </p>
          )}
        </section>
      )}
      {task.missingRecipes?.length > 0 && (
        <p role="alert" className="rounded-xl bg-amber-50 p-4 text-amber-800">
          Chưa có công thức đang áp dụng cho: {task.missingRecipes.join(", ")}.{" "}
          <Link
            className="font-semibold underline"
            to="/dashboard/menu/recipes"
          >
            Xem công thức / liên hệ bếp trưởng
          </Link>
        </p>
      )}
      <section className="space-y-4 rounded-2xl bg-white p-5">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <ClipboardList size={20} />
          Công thức & Định mức nhiệm vụ
        </h3>
        {task.dishes.map((dish) => (
          <article
            key={dish.productId}
            className="rounded-xl border border-slate-100 p-4"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <h4 className="font-semibold">
                {dish.name} · {format(dish.quantity)} thành phẩm
              </h4>
              <span className="text-xs text-slate-500">
                Công thức phiên bản {dish.recipeVersion}
              </span>
            </div>
            {dish.description && (
              <p className="mt-2 text-sm text-slate-500">{dish.description}</p>
            )}
            <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {dish.requirements.map((line) => (
                <li key={line.productId}>
                  {line.name}:{" "}
                  <strong>
                    {format(line.quantity)} {line.unit}
                  </strong>
                </li>
              ))}
            </ul>
            {dish.requiresSample && (
              <p className="mt-3 text-xs font-semibold text-orange-600">
                Bắt buộc lưu mẫu trước khi hoàn tất.
              </p>
            )}
          </article>
        ))}
      </section>
      {!mayAct && (
        <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
          Nhiệm vụ đang do {task.ownerName} thực hiện. Bạn có thể xem hồ sơ.
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
          {error}{" "}
          <button onClick={reload} className="font-semibold underline">
            Làm mới nhiệm vụ
          </button>
        </p>
      )}
      {task.status === "WAITING" && task.dishes.length > 0 && (
        <form
          onSubmit={submit("receive", () => ({
            dishes: receivingDishes
              .filter((dish) => dish.quantity > 0)
              .map((dish) => ({
                productId: dish.productId,
                ...(task.type === "ticket" ? { quantity: dish.quantity } : {}),
                inputLots: task.lots
                  .filter(
                    (lot) =>
                      Number(allocations[`${dish.productId}:${lot.id}`]) > 0,
                  )
                  .map((lot) => ({
                    lotId: lot.id,
                    quantity: Number(
                      allocations[`${dish.productId}:${lot.id}`],
                    ),
                  })),
              })),
          }))}
          className="space-y-4 rounded-2xl bg-white p-5"
        >
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <PackageCheck size={20} />
            Nhận nguyên liệu theo lô
          </h3>
          <p className="text-sm text-slate-500">
            Kiểm tra số lượng, lô và hạn dùng thực tế. Xác nhận chưa trừ tồn; hệ
            thống kiểm tra lại và trừ kho khi bắt đầu chế biến.
          </p>
          {task.type === "ticket" && (
            <div className="space-y-3 rounded-xl bg-amber-50 p-4">
              {(task.suggestedRound || []).map((dish) => (
                <p key={dish.productId} className="text-sm">
                  {dish.name}: đợt này có thể làm{" "}
                  <strong>
                    {format(dish.quantity)}/
                    {format(dish.quantity + dish.remainingQuantity)} suất
                  </strong>
                  .
                </p>
              ))}
              <p className="text-xs text-slate-600">
                Số suất tính theo nguyên liệu giới hạn. Các món dùng chung
                nguyên liệu được gợi ý lần lượt theo thứ tự hiển thị; có thể
                điều chỉnh trước khi xác nhận.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={buttonClass}
                  disabled={
                    busy ||
                    !mayAct ||
                    !(task.suggestedRound || []).some(
                      (dish) => dish.quantity > 0,
                    )
                  }
                  onClick={applySuggestedRound}
                >
                  {(task.suggestedRound || []).some(
                    (dish) => dish.remainingQuantity > 0,
                  )
                    ? "Làm trước phần đủ nguyên liệu"
                    : "Nhận đủ nguyên liệu"}{" "}
                  · Chọn lô FEFO
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-amber-300 px-4 py-2 font-semibold text-amber-900"
                  disabled={
                    busy ||
                    !mayAct ||
                    !(task.suggestedRound || []).some(
                      (dish) => dish.remainingQuantity > 0,
                    )
                  }
                  onClick={() => mutate("wait")}
                >
                  Chờ bổ sung đủ · Báo Admin
                </button>
              </div>
            </div>
          )}
          {receivingDishes.map((dish) => (
            <fieldset
              disabled={busy || !mayAct}
              key={dish.productId}
              className="space-y-4 rounded-xl border p-4"
            >
              <legend className="font-semibold">{dish.name}</legend>
              {task.type === "ticket" && (
                <label className="flex items-center gap-3 text-sm font-semibold">
                  Số suất đợt này
                  <input
                    type="number"
                    min="0"
                    step="1"
                    max={Math.min(
                      10000,
                      task.dishes.find(
                        (row) => row.productId === dish.productId,
                      ).quantity,
                    )}
                    value={roundQuantities[dish.productId]}
                    className="w-28 rounded-lg border px-3 py-2"
                    onChange={(event) => {
                      setRoundQuantities({
                        ...roundQuantities,
                        [dish.productId]: event.target.value,
                      });
                      setAllocations({});
                    }}
                  />
                  <span className="font-normal text-slate-500">
                    Nhập 0 để làm món này ở đợt sau.
                  </span>
                </label>
              )}
              {dish.quantity > 0 &&
                dish.requirements.map((line) => {
                  const lots = task.lots.filter(
                    (lot) => lot.productId === line.productId,
                  );
                  const allocated = lots.reduce(
                    (sum, lot) =>
                      sum +
                      Number(allocations[`${dish.productId}:${lot.id}`] || 0),
                    0,
                  );
                  return (
                    <div key={line.productId}>
                      <p className="mb-2 text-sm font-semibold">
                        {line.name} · Cần {format(line.quantity)} {line.unit} ·
                        Đã chọn {format(allocated)} {line.unit}
                      </p>
                      {!lots.length && (
                        <p className="text-sm text-red-600">
                          Không có lô còn hạn/còn tồn. Cần quản trị bổ sung
                          nguyên liệu.
                        </p>
                      )}
                      <div className="space-y-2">
                        {lots.map((lot) => (
                          <label
                            key={lot.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"
                          >
                            <span>
                              {lot.lotCode} · {lot.stockName}
                              <span className="mt-1 block text-xs text-slate-500">
                                Tồn {format(lot.quantity)} {line.unit} · HSD{" "}
                                {lot.expiresAt || "Không áp dụng"}
                              </span>
                            </span>
                            <input
                              aria-label={`Nhận ${dish.name} - ${line.name} - ${lot.lotCode}`}
                              type="number"
                              min="0"
                              max={lot.quantity}
                              step="0.0001"
                              className="w-28 rounded-lg border px-3 py-2"
                              value={
                                allocations[`${dish.productId}:${lot.id}`] || ""
                              }
                              onChange={(e) =>
                                setAllocations({
                                  ...allocations,
                                  [`${dish.productId}:${lot.id}`]:
                                    e.target.value,
                                })
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </fieldset>
          ))}
          <button
            className={buttonClass}
            disabled={
              busy ||
              !mayAct ||
              task.missingRecipes.length > 0 ||
              !receivingDishes.some((dish) => dish.quantity > 0)
            }
          >
            {actionLabels.receive}
          </button>
        </form>
      )}
      {task.received.length > 0 && (
        <section className="space-y-3 rounded-2xl bg-white p-5">
          <h3 className="text-lg font-bold">Nguyên liệu đã xác nhận</h3>
          {task.received.map((entry) => (
            <div key={entry.batchId} className="rounded-xl border p-4">
              <p className="mb-2 font-semibold">{entry.name}</p>
              {entry.inputLots.map((line) => (
                <p key={line.lotId} className="text-sm text-slate-600">
                  {line.lotCode}: {format(line.quantity)} {line.unit}
                </p>
              ))}
            </div>
          ))}
        </section>
      )}
      {task.status === "RECEIVED" && (
        <button
          onClick={() => mutate("start")}
          disabled={busy || !mayAct}
          className={buttonClass}
        >
          {busy ? "Đang bắt đầu…" : actionLabels.start}
        </button>
      )}
      {(task.status === "PREPARING" ||
        (task.status === "RECORDED" && editingActuals)) && (
        <form
          onSubmit={submit("record", () => ({ actuals }))}
          className="space-y-4 rounded-2xl bg-white p-5"
        >
          <h3 className="text-lg font-bold">Ghi nhận thực tế</h3>
          <p className="text-sm text-slate-500">
            Lượng thực dùng + hao hụt không vượt lượng đã nhận. Phần không dùng
            sẽ hoàn về đúng lô khi kiểm tra hoàn thành.
          </p>
          {actuals.map((actual, index) => {
            const entry = task.received.find(
              (row) => row.batchId === actual.batchId,
            );
            const change = (key, value) =>
              setActuals((current) =>
                current.map((row, i) =>
                  i === index ? { ...row, [key]: value } : row,
                ),
              );
            return (
              <fieldset
                key={actual.batchId}
                disabled={busy || !mayAct}
                className="space-y-3 rounded-xl border p-4"
              >
                <legend className="font-semibold">{entry.name}</legend>
                <Field
                  label={`Số thành phẩm đạt - ${entry.name}`}
                  type="number"
                  min="1"
                  step="1"
                  value={actual.quantity}
                  onChange={(value) => change("quantity", value)}
                />
                {actual.lots.map((line, lotIndex) => {
                  const issued = entry.inputLots.find(
                    (row) => row.lotId === line.lotId,
                  );
                  const update = (key, value) =>
                    change(
                      "lots",
                      actual.lots.map((row, i) =>
                        i === lotIndex ? { ...row, [key]: value } : row,
                      ),
                    );
                  return (
                    <div
                      key={line.lotId}
                      className="rounded-xl bg-slate-50 p-3"
                    >
                      <p className="mb-2 text-sm font-medium">
                        {issued.lotCode} · Đã nhận {format(issued.quantity)}{" "}
                        {issued.unit}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label={`Thực dùng ${issued.lotCode}`}
                          type="number"
                          min="0"
                          step="0.0001"
                          value={line.used}
                          onChange={(value) => update("used", value)}
                        />
                        <Field
                          label={`Hao hụt ${issued.lotCode}`}
                          type="number"
                          min="0"
                          step="0.0001"
                          value={line.waste}
                          onChange={(value) => update("waste", value)}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Hoàn lại dự kiến:{" "}
                        {format(
                          Math.max(
                            0,
                            issued.quantity -
                              Number(line.used) -
                              Number(line.waste),
                          ),
                        )}{" "}
                        {issued.unit}
                      </p>
                    </div>
                  );
                })}
                <Field
                  label={`Ghi chú / lý do hao hụt - ${entry.name}`}
                  required={actual.lots.some((line) => Number(line.waste) > 0)}
                  value={actual.note}
                  onChange={(value) => change("note", value)}
                />
              </fieldset>
            );
          })}
          <button className={buttonClass} disabled={busy || !mayAct}>
            {actionLabels.record}
          </button>
        </form>
      )}
      {task.status === "RECORDED" && !editingActuals && (
        <button
          className="text-sm font-semibold text-blue-600 underline"
          onClick={() => setEditingActuals(true)}
        >
          Chỉnh lại số liệu thực tế
        </button>
      )}
      {task.status === "RECORDED" && !editingActuals && (
        <form
          onSubmit={submit("complete", () => ({
            qualityPassed,
            samples: Object.entries(samples).map(([batchId, value]) => ({
              batchId,
              ...value,
              quantity: Number(value.quantity),
            })),
          }))}
          className="space-y-4 rounded-2xl bg-white p-5"
        >
          <h3 className="text-lg font-bold">Kiểm tra và hoàn thành</h3>
          {task.actuals.map((actual) => (
            <p key={actual.batchId} className="text-sm">
              {
                task.received.find((entry) => entry.batchId === actual.batchId)
                  ?.name
              }
              : <strong>{format(actual.quantity)} thành phẩm đạt</strong>
            </p>
          ))}
          {task.received
            .filter(
              (entry) =>
                task.dishes.find((dish) => dish.productId === entry.productId)
                  ?.requiresSample,
            )
            .map((entry) => {
              const sample = samples[entry.batchId] || {
                quantity: "",
                unit: "g",
                storageLocation: "",
              };
              const update = (key, value) =>
                setSamples({
                  ...samples,
                  [entry.batchId]: { ...sample, [key]: value },
                });
              return (
                <fieldset
                  key={entry.batchId}
                  disabled={busy || !mayAct}
                  className="space-y-3 rounded-xl border p-4"
                >
                  <legend className="font-semibold">
                    Lưu mẫu · {entry.name}
                  </legend>
                  <Field
                    label={`Lượng mẫu - ${entry.name}`}
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={sample.quantity}
                    onChange={(value) => update("quantity", value)}
                  />
                  <Field
                    label={`Đơn vị mẫu - ${entry.name}`}
                    options={["g", "ml"]}
                    value={sample.unit}
                    onChange={(value) => update("unit", value)}
                  />
                  <Field
                    label={`Nơi lưu mẫu - ${entry.name}`}
                    value={sample.storageLocation}
                    onChange={(value) => update("storageLocation", value)}
                  />
                </fieldset>
              );
            })}
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              required
              type="checkbox"
              checked={qualityPassed}
              disabled={busy || !mayAct}
              onChange={(e) => setQualityPassed(e.target.checked)}
            />
            Xác nhận thành phẩm đạt yêu cầu
          </label>
          <button className={buttonClass} disabled={busy || !mayAct}>
            {actionLabels.complete}
          </button>
        </form>
      )}
      {(task.status === "COMPLETED" || partialHandover) && (
        <form
          onSubmit={submit(
            partialHandover ? "handover-partial" : "handover",
            () => ({
              receivedBy,
              receiverPlace,
              confirmPartial,
              items: handoverItems.map((actual) => ({
                batchId: actual.batchId,
                quantity: actual.quantity,
              })),
            }),
          )}
          className="space-y-4 rounded-2xl bg-white p-5"
        >
          <h3 className="text-lg font-bold">
            {partialHandover
              ? "Bàn giao phần đã hoàn thành"
              : "Bàn giao thành phẩm"}
          </h3>
          <p className="text-sm text-slate-500">
            {partialHandover
              ? "Chỉ bàn giao các đợt đã qua kiểm tra. Phần còn lại tiếp tục chờ nguyên liệu, đơn chưa hoàn tất."
              : "Bàn giao sản lượng đã hoàn tất còn lại của nhiệm vụ này."}
          </p>
          {handoverItems.map((actual) => (
            <p key={actual.batchId}>
              {actual.name ||
                task.received.find((entry) => entry.batchId === actual.batchId)
                  ?.name}
              : <strong>{format(actual.quantity)}</strong>
            </p>
          ))}
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Chọn nhanh người / bộ phận nhận
            </p>
            <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
              {recipientSuggestions.map((suggestion) => (
                <button
                  key={suggestion.name}
                  type="button"
                  aria-pressed={receivedBy === suggestion.name}
                  disabled={busy || !mayAct || !mayHandover}
                  className={`rounded-lg border px-3 py-2 text-sm ${receivedBy === suggestion.name ? "border-blue-600 bg-blue-50 font-semibold text-blue-700" : "border-slate-200 text-slate-700"}`}
                  onClick={() => setReceivedBy(suggestion.name)}
                >
                  {suggestion.name}
                  {suggestion.source === "RECENT" ? " · Gần đây" : ""}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">
              Chọn người hoặc bộ phận thực tế nhận món. Có thể nhập tên khác bên
              dưới.
            </p>
          </div>
          <Field
            label="Người / bộ phận nhận thành phẩm"
            value={receivedBy}
            onChange={setReceivedBy}
          />
          <div className="flex flex-wrap gap-2">
            {placeSuggestions.map((place) => (
              <button
                key={place}
                type="button"
                aria-pressed={receiverPlace === place}
                disabled={busy || !mayAct || !mayHandover}
                className={`rounded-lg border px-3 py-2 text-sm ${receiverPlace === place ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-700"}`}
                onClick={() => setReceiverPlace(place)}
              >
                {place}
              </button>
            ))}
          </div>
          <Field
            label="Nơi nhận"
            value={receiverPlace}
            onChange={setReceiverPlace}
          />
          {partialHandover && (
            <label className="flex items-start gap-3 text-sm font-semibold text-amber-800">
              <input
                type="checkbox"
                checked={confirmPartial}
                disabled={busy || !mayAct || !mayHandover}
                onChange={(event) => setConfirmPartial(event.target.checked)}
              />
              Tôi xác nhận cho bàn giao một phần đơn; phần còn lại vẫn cần chế
              biến và bàn giao tiếp.
            </label>
          )}
          {partialHandover && !mayHandover && (
            <p className="text-sm text-amber-700">
              Cần bếp trưởng hoặc quản lý xác nhận bàn giao một phần.
            </p>
          )}
          <button
            className={buttonClass}
            disabled={
              busy ||
              !mayAct ||
              !mayHandover ||
              (partialHandover && !confirmPartial)
            }
          >
            {actionLabels.handover}
          </button>
        </form>
      )}
      {(task.partialHandovers || []).map((handover) => (
        <section
          key={handover.deliveredAt}
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          Đã bàn giao{" "}
          {format(handover.items.reduce((sum, item) => sum + item.quantity, 0))}{" "}
          thành phẩm cho {handover.receivedBy} ·{" "}
          {new Date(handover.deliveredAt).toLocaleString("vi-VN")}. Phần còn lại
          tiếp tục theo tiến độ đơn.
        </section>
      ))}
      {task.handover && (
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-sm text-emerald-800">
          <h3 className="mb-2 font-bold">Đã bàn giao thành phẩm</h3>
          <p>Người nhận: {task.handover.receivedBy}</p>
          {task.handover.receiverPlace && (
            <p>Nơi nhận: {task.handover.receiverPlace}</p>
          )}
          <p>
            Thời gian:{" "}
            {new Date(task.handover.deliveredAt).toLocaleString("vi-VN")}
          </p>
        </section>
      )}
      {task.history.length > 0 && (
        <section className="rounded-2xl bg-white p-5">
          <h3 className="mb-3 text-lg font-bold">Nhật ký xử lý</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {task.history.map((event, index) => (
              <li key={index}>
                {actionLabels[event.action] || event.action} ·{" "}
                {new Date(event.at).toLocaleString("vi-VN")}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
