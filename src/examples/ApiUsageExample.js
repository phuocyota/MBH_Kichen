/**
 * Ví dụ cách chuyển đổi từ localStorage sang API
 * Thay thế các hàm read*/save* trong datas/
 */

import {
  useMealPlans,
  useMenus,
  useBatches,
  useFinishedImports,
  useFinishedExports,
  useFinishedInventory,
  useSamples,
  useKitchenActions,
} from '../hooks/useKitchenApi';
import { kitchenApi } from '../api/kitchenApi';

/**
 * ============================================
 * VÍ DỤ 1: DashboardPage
 * ============================================
 */

// TRƯỚC (localStorage):
/*
import {
  readStoredKitchenDishes,
  readStoredKitchenMenus,
  readStoredKitchenPlans,
  readStoredCookingTracking,
} from '../datas/kitchenPlanData';

function DashboardPage() {
  const dishList = readStoredKitchenDishes();
  const menuList = readStoredKitchenMenus();
  const planList = readStoredKitchenPlans();
  const trackingList = readStoredCookingTracking();
  // ...
}
*/

// SAU (API):
function DashboardPageWithApi() {
  // Fetch theo ngày, ca được chọn
  const { data: batches, loading: batchesLoading } = useBatches({
    date: selectedDate,
    shift: selectedShift,
  });

  const { data: imports, loading: importsLoading } = useFinishedImports({
    date: selectedDate,
    shift: selectedShift,
  });

  const { data: exports, loading: exportsLoading } = useFinishedExports({
    date: selectedDate,
    shift: selectedShift,
  });

  const { data: inventory, loading: inventoryLoading } = useFinishedInventory({
    date: selectedDate,
    shift: selectedShift,
  });

  const { data: samples, loading: samplesLoading } = useSamples({
    date: selectedDate,
    shift: selectedShift,
  });

  // Build cooking rows từ batches
  const cookingRows = (batches || []).map((batch) => ({
    id: batch.id,
    planId: batch.manualLineId,
    dish: { name: batch.product?.name },
    plannedQuantity: batch.plannedQuantity,
    actualQuantity: batch.actualQuantity,
    startedAt: batch.startedAt,
    estimatedDoneAt: batch.details?.estimatedDoneAt,
    status: mapBatchStatus(batch.status),
    menu: batch.mealPlan || {},
  }));

  // ...
}

/**
 * ============================================
 * VÍ DỤ 2: KitchenPlanTodayPage
 * ============================================
 */

function KitchenPlanTodayPageWithApi() {
  const { data: mealPlans, loading: plansLoading, refetch: refetchPlans } = useMealPlans({
    date: selectedDate,
    mealPeriod: selectedMeal !== 'Tất cả' ? selectedMeal : undefined,
    shift: selectedShift !== 'Tất cả' ? selectedShift : undefined,
  });

  const { data: menus, loading: menusLoading, refetch: refetchMenus } = useMenus({
    date: selectedDate,
  });

  const { createMealPlan, updateMealPlan, loading: saving } = useKitchenActions();

  async function savePlan(planValue) {
    try {
      const payload = {
        date: planValue.date,
        mealPeriod: planValue.meal,
        shift: planValue.shift,
        items: planValue.items.map((item) => ({
          productId: item.dishId,
          expectedQuantity: item.expectedQuantity,
          plannedStartAt: item.plannedStartAt,
          deadline: item.deadline,
          serviceArea: item.serviceArea,
          stationId: item.stationId,
        })),
      };

      if (planValue.id) {
        // Update existing plan
        await updateMealPlan(planValue.id, payload);
      } else {
        // Create new plan
        await createMealPlan(payload);
      }

      // Refresh data
      refetchPlans();
      refetchMenus();
      closeModal();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert(error.message || 'Lỗi khi lưu kế hoạch');
    }
  }

  // ...
}

/**
 * ============================================
 * VÍ DỤ 3: MealImportPage
 * ============================================
 */

function MealImportPageWithApi() {
  const { data: imports, loading, refetch: refetchImports } = useFinishedImports({
    date: dateFilter,
  });

  const { data: batches, refetch: refetchBatches } = useBatches({
    date: dateFilter,
    status: 'COMPLETED', // Chỉ lấy batch đã hoàn thành
  });

  const { createFinishedImport, confirmFinishedImport, loading: saving } = useKitchenActions();

  // Build candidates từ batches đã hoàn thành nhưng chưa import đủ
  const importCandidates = (batches || []).map((batch) => {
    const importedQty = (imports || [])
      .filter((imp) => imp.batchId === batch.id)
      .reduce((sum, imp) => sum + Number(imp.quantity), 0);

    return {
      ...batch,
      availableQuantity: Number(batch.actualQuantity) - importedQty,
    };
  }).filter((row) => row.availableQuantity > 0);

  async function saveImport(formValue) {
    try {
      await createFinishedImport({
        batchId: formValue.sourceRow.batchId,
        quantity: formValue.quantity,
        importedAt: formValue.importedAt,
        importedBy: formValue.importedBy,
        receiverArea: formValue.receiverArea,
        note: formValue.note,
      });

      refetchImports();
      refetchBatches();
      setActiveModal(null);
    } catch (error) {
      console.error('Error saving import:', error);
      alert(error.message || 'Lỗi khi lưu phiếu nhập');
    }
  }

  async function confirmImport(row) {
    try {
      await confirmFinishedImport(row.id, {
        requestId: `confirm-${row.id}-${Date.now()}`,
      });

      refetchImports();
    } catch (error) {
      console.error('Error confirming import:', error);
      alert(error.message || 'Lỗi khi xác nhận');
    }
  }

  // ...
}

/**
 * ============================================
 * VÍ DỤ 4: CookingTrackingPage
 * ============================================
 */

function CookingTrackingPageWithApi() {
  const { data: batches, loading, refetch: refetchBatches } = useBatches({
    date: selectedDate,
    shift: selectedShift,
  });

  const { startBatch, readyBatch, completeBatch, loading: actionLoading } = useKitchenActions();

  async function handleStartCooking(row) {
    try {
      await startBatch(row.id, {
        requestId: `start-${row.id}-${Date.now()}`,
      });
      refetchBatches();
    } catch (error) {
      console.error('Error starting batch:', error);
      alert(error.message || 'Lỗi khi bắt đầu chế biến');
    }
  }

  async function handleCompleteCooking(row) {
    try {
      await completeBatch(row.id, {
        actualQuantity: row.actualQuantity,
        requestId: `complete-${row.id}-${Date.now()}`,
      });
      refetchBatches();
    } catch (error) {
      console.error('Error completing batch:', error);
      alert(error.message || 'Lỗi khi hoàn thành');
    }
  }

  // ...
}

/**
 * ============================================
 * VÍ DỤ 5: ShiftSummaryPage
 * ============================================
 */

function ShiftSummaryPageWithApi() {
  const { data: shiftClosings, loading, refetch: refetchClosings } = useKitchenFetch(
    () => kitchenApi.shiftClosing.list({ date: selectedDate, shift: selectedShift }),
    [],
    [selectedDate, selectedShift]
  );

  const { confirmShift, approveShift, loading: actionLoading } = useKitchenActions();

  const closing = (shiftClosings || []).find(
    (sc) => sc.date === selectedDate && sc.shift === selectedShift
  );

  async function handleConfirmShift() {
    try {
      await confirmShift(closing?.id, {
        requestId: `confirm-${selectedDate}-${selectedShift}-${Date.now()}`,
      });
      refetchClosings();
    } catch (error) {
      console.error('Error confirming shift:', error);
      alert(error.message || 'Lỗi khi xác nhận ca');
    }
  }

  async function handleApproveShift() {
    try {
      await approveShift(closing?.id, {
        requestId: `approve-${selectedDate}-${selectedShift}-${Date.now()}`,
      });
      refetchClosings();
    } catch (error) {
      console.error('Error approving shift:', error);
      alert(error.message || 'Lỗi khi duyệt ca');
    }
  }

  // ...
}

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

function mapBatchStatus(status) {
  const statusMap = {
    WAITING: 'Chờ xác nhận',
    PREPARING: 'Đang chế biến',
    READY: 'Sẵn sàng',
    COMPLETED: 'Hoàn thành',
  };
  return statusMap[status] || status;
}

function mapShiftClosingStatus(closing) {
  if (closing?.locked) return 'Đã khóa';
  if (closing?.approvedAt) return 'Đã duyệt';
  if (closing?.confirmedAt) return 'Chờ duyệt';
  return 'Chưa chốt';
}

// Custom hook for fetching với params thay đổi
function useKitchenFetch(fetchFn, params = [], deps = []) {
  // Implementation từ useKitchenApi.js
}

/**
 * ============================================
 * CÁCH SỬ DỤNG TRONG COMPONENT THỰC TẾ
 * ============================================
 */

/*
// Trong DashboardPage.jsx, thay đổi như sau:

import {
  useBatches,
  useFinishedImports,
  useFinishedExports,
  useFinishedInventory,
  useSamples,
  useKitchenActions,
} from '../hooks/useKitchenApi';

function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState(getCurrentDate());
  const [selectedShift, setSelectedShift] = useState(shiftOptions[1]);

  // Fetch data từ API
  const { data: batches } = useBatches({ date: selectedDate, shift: selectedShift });
  const { data: imports } = useFinishedImports({ date: selectedDate, shift: selectedShift });
  const { data: exports } = useFinishedExports({ date: selectedDate, shift: selectedShift });
  const { data: inventory } = useFinishedInventory({ date: selectedDate, shift: selectedShift });
  const { data: samples } = useSamples({ date: selectedDate, shift: selectedShift });

  // Build cooking rows
  const cookingRows = (batches || []).map(batch => ({
    id: batch.id,
    planId: batch.manualLineId,
    dish: batch.product,
    plannedQuantity: batch.plannedQuantity,
    status: mapBatchStatus(batch.status),
    startedAt: batch.startedAt,
    estimatedDoneAt: batch.details?.estimatedDoneAt,
    menu: batch.mealPlan,
  })).filter(row => row.menu?.date === selectedDate && row.menu?.shift === selectedShift);

  // Dashboard stats
  const dashboardStats = [
    { key: 'total', label: 'Tổng món hôm nay', value: cookingRows.length, ... },
    { key: 'processing', label: 'Đang làm', value: cookingRows.filter(r => r.status === 'Đang chế biến').length, ... },
    { key: 'completed', label: 'Đã hoàn thành', value: cookingRows.filter(r => r.status === 'Hoàn thành').length, ... },
    // ...
  ];

  // ...
}
*/
