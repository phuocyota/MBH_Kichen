/**
 * React Hooks cho Kitchen API
 * Sử dụng useState + useEffect hoặc có thể integrate với React Query
 */

import { useState, useEffect, useCallback } from 'react';
import * as kitchenService from '../services/kitchenService';

// ============================================
// BASE HOOKS
// ============================================

/**
 * Hook cơ bản để fetch data từ API
 */
export function useKitchenFetch(fetchFn, params = [], deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchFn(...params);
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Lỗi khi lấy dữ liệu');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => {
    fetchData();
  }, deps);

  return { data, loading, error, refetch };
}

// ============================================
// MENUS
// ============================================

export function useMenus(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchMenus(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// MEAL PLANS
// ============================================

export function useMealPlans(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchMealPlans(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// BATCHES
// ============================================

export function useBatches(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchBatches(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// FINISHED IMPORTS
// ============================================

export function useFinishedImports(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchFinishedImports(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// FINISHED EXPORTS
// ============================================

export function useFinishedExports(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchFinishedExports(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// FINISHED INVENTORY
// ============================================

export function useFinishedInventory(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchFinishedInventory(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// DISPOSALS
// ============================================

export function useDisposals(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchDisposals(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// SAMPLES
// ============================================

export function useSamples(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchSamples(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// SHIFT CLOSINGS
// ============================================

export function useShiftClosings(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchShiftClosings(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// DASHBOARD
// ============================================

export function useDashboard(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchDashboardSummary(params),
    [],
    [JSON.stringify(params)]
  );
}

export function useMealFlowReport(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchMealFlowReport(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// MEAL FLOW STATE (Combined)
// ============================================

export function useMealFlowState(params = {}) {
  const [state, setState] = useState({
    batches: [],
    importRows: [],
    exportRows: [],
    inventoryRows: [],
    sampleRows: [],
    dishList: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchState() {
      setLoading(true);
      setError(null);
      try {
        const result = await kitchenService.getMealFlowState(params);
        if (isMounted) {
          setState(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Lỗi khi lấy dữ liệu');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchState();

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(params)]);

  const refetch = useCallback(() => {
    kitchenService.getMealFlowState(params).then(setState).catch(setError);
  }, [JSON.stringify(params)]);

  return { ...state, loading, error, refetch };
}

// ============================================
// PRODUCTS
// ============================================

export function useKitchenProducts() {
  return useKitchenFetch(
    () => kitchenService.fetchKitchenProducts(),
    [],
    []
  );
}

export function useIngredients() {
  return useKitchenFetch(
    () => kitchenService.fetchIngredients(),
    [],
    []
  );
}

// ============================================
// STATIONS
// ============================================

export function useStations() {
  return useKitchenFetch(
    () => kitchenService.fetchStations(),
    [],
    []
  );
}

// ============================================
// RECIPES
// ============================================

export function useRecipes(productId) {
  return useKitchenFetch(
    () => kitchenService.fetchRecipes(productId),
    [productId],
    [productId]
  );
}

// ============================================
// CONSUMPTION & DEMAND
// ============================================

export function useConsumptionSessions(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchConsumptionSessions(params),
    [],
    [JSON.stringify(params)]
  );
}

export function useIngredientDemand(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchIngredientDemand(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// TICKETS
// ============================================

export function useTickets(params = {}) {
  return useKitchenFetch(
    () => kitchenService.fetchTickets(params),
    [],
    [JSON.stringify(params)]
  );
}

// ============================================
// ACTIONS HOOK
// ============================================

/**
 * Hook để thực hiện các actions (create, update, delete)
 */
export function useKitchenActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (actionFn, ...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await actionFn(...args);
      return result;
    } catch (err) {
      setError(err.message || 'Lỗi khi thực hiện');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Menu actions
  const createMenu = useCallback((data) => execute(kitchenService.createMenu, data), [execute]);
  const updateMenu = useCallback((id, data) => execute(kitchenService.updateMenu, id, data), [execute]);
  const lockMenu = useCallback((id) => execute(kitchenService.lockMenu, id), [execute]);

  // Meal Plan actions
  const createMealPlan = useCallback((data) => execute(kitchenService.createMealPlan, data), [execute]);
  const updateMealPlan = useCallback((id, data) => execute(kitchenService.updateMealPlan, id, data), [execute]);
  const lockMealPlan = useCallback((id) => execute(kitchenService.lockMealPlan, id), [execute]);

  // Batch actions
  const startBatch = useCallback((id, data) => execute(kitchenService.startBatch, id, data), [execute]);
  const readyBatch = useCallback((id, data) => execute(kitchenService.readyBatch, id, data), [execute]);
  const completeBatch = useCallback((id, data) => execute(kitchenService.completeBatch, id, data), [execute]);

  // Import actions
  const createFinishedImport = useCallback((data) => execute(kitchenService.createFinishedImport, data), [execute]);
  const confirmFinishedImport = useCallback((id, data) => execute(kitchenService.confirmFinishedImport, id, data), [execute]);

  // Export actions
  const createFinishedExport = useCallback((data) => execute(kitchenService.createFinishedExport, data), [execute]);
  const returnFinishedExport = useCallback((id, data) => execute(kitchenService.returnFinishedExport, id, data), [execute]);

  // Inventory actions
  const adjustInventory = useCallback((id, data) => execute(kitchenService.adjustFinishedInventory, id, data), [execute]);
  const releaseInventory = useCallback((id, data) => execute(kitchenService.releaseFinishedInventory, id, data), [execute]);

  // Disposal actions
  const createDisposal = useCallback((data) => execute(kitchenService.createDisposal, data), [execute]);
  const confirmDisposal = useCallback((id, data) => execute(kitchenService.confirmDisposal, id, data), [execute]);

  // Sample actions
  const createSample = useCallback((data) => execute(kitchenService.createSample, data), [execute]);
  const processSample = useCallback((id, data) => execute(kitchenService.processSample, id, data), [execute]);

  // Shift closing actions
  const confirmShift = useCallback((id, data) => execute(kitchenService.confirmShiftClosing, id, data), [execute]);
  const approveShift = useCallback((id, data) => execute(kitchenService.approveShiftClosing, id, data), [execute]);

  // Ticket actions
  const startTicket = useCallback((id) => execute(kitchenService.startTicket, id), [execute]);
  const readyTicket = useCallback((id) => execute(kitchenService.readyTicket, id), [execute]);

  return {
    loading,
    error,
    // Menus
    createMenu,
    updateMenu,
    lockMenu,
    // Meal Plans
    createMealPlan,
    updateMealPlan,
    lockMealPlan,
    // Batches
    startBatch,
    readyBatch,
    completeBatch,
    // Imports
    createFinishedImport,
    confirmFinishedImport,
    // Exports
    createFinishedExport,
    returnFinishedExport,
    // Inventory
    adjustInventory,
    releaseInventory,
    // Disposals
    createDisposal,
    confirmDisposal,
    // Samples
    createSample,
    processSample,
    // Shift
    confirmShift,
    approveShift,
    // Tickets
    startTicket,
    readyTicket,
  };
}
