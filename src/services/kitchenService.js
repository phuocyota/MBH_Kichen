/**
 * Kitchen Data Service
 * Chuyển đổi dữ liệu từ API sang format mà UI component mong đợi
 * Thay thế localStorage operations bằng API calls
 */

import kitchenApi from '../api/kitchenApi';

// ============================================
// HELPERS
// ============================================

function getCurrentDate() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentDateTime() {
  return new Date().toISOString();
}

// ============================================
// MENU DATA
// ============================================

export async function fetchMenus(params = {}) {
  try {
    const response = await kitchenApi.menu.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching menus:', error);
    return [];
  }
}

export async function createMenu(data) {
  return kitchenApi.menu.create(data);
}

export async function updateMenu(id, data) {
  return kitchenApi.menu.update(id, data);
}

export async function lockMenu(id) {
  return kitchenApi.menu.lock(id);
}

export async function copyMenu(id, data) {
  return kitchenApi.menu.copy(id, data);
}

// ============================================
// KITCHEN PLAN DATA
// ============================================

export async function fetchMealPlans(params = {}) {
  try {
    const response = await kitchenApi.mealPlan.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching meal plans:', error);
    return [];
  }
}

export async function createMealPlan(data) {
  return kitchenApi.mealPlan.create(data);
}

export async function updateMealPlan(id, data) {
  return kitchenApi.mealPlan.update(id, data);
}

export async function lockMealPlan(id) {
  return kitchenApi.mealPlan.lock(id);
}

export async function addMealPlanAdjustment(id, data) {
  return kitchenApi.mealPlan.addAdjustment(id, data);
}

// ============================================
// BATCH DATA (PRODUCTION)
// ============================================

export async function fetchBatches(params = {}) {
  try {
    const response = await kitchenApi.batch.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching batches:', error);
    return [];
  }
}

export async function updateBatch(id, data) {
  return kitchenApi.batch.update(id, data);
}

export async function startBatch(id, data = {}) {
  return kitchenApi.batch.start(id, data);
}

export async function readyBatch(id, data = {}) {
  return kitchenApi.batch.ready(id, data);
}

export async function completeBatch(id, data = {}) {
  return kitchenApi.batch.complete(id, data);
}

// ============================================
// FINISHED IMPORTS (NHẬP MÓN)
// ============================================

export async function fetchFinishedImports(params = {}) {
  try {
    const response = await kitchenApi.finishedImport.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching finished imports:', error);
    return [];
  }
}

export async function createFinishedImport(data) {
  return kitchenApi.finishedImport.create(data);
}

export async function updateFinishedImport(id, data) {
  return kitchenApi.finishedImport.update(id, data);
}

export async function confirmFinishedImport(id, data = {}) {
  return kitchenApi.finishedImport.confirm(id, data);
}

// ============================================
// FINISHED EXPORTS (XUẤT MÓN)
// ============================================

export async function fetchFinishedExports(params = {}) {
  try {
    const response = await kitchenApi.finishedExport.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching finished exports:', error);
    return [];
  }
}

export async function createFinishedExport(data) {
  return kitchenApi.finishedExport.create(data);
}

export async function returnFinishedExport(id, data) {
  return kitchenApi.finishedExport.returns(id, data);
}

// ============================================
// FINISHED INVENTORY (TỒN KHO MÓN)
// ============================================

export async function fetchFinishedInventory(params = {}) {
  try {
    const response = await kitchenApi.finishedInventory.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching finished inventory:', error);
    return [];
  }
}

export async function adjustFinishedInventory(id, data) {
  return kitchenApi.finishedInventory.adjustments(id, data);
}

export async function releaseFinishedInventory(id, data) {
  return kitchenApi.finishedInventory.release(id, data);
}

// ============================================
// DISPOSALS (HỦY MÓN)
// ============================================

export async function fetchDisposals(params = {}) {
  try {
    const response = await kitchenApi.disposal.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching disposals:', error);
    return [];
  }
}

export async function createDisposal(data) {
  return kitchenApi.disposal.create(data);
}

export async function confirmDisposal(id, data = {}) {
  return kitchenApi.disposal.confirmDisposal(id, data);
}

// ============================================
// SAMPLES (LƯU MẪU)
// ============================================

export async function fetchSamples(params = {}) {
  try {
    const response = await kitchenApi.sample.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching samples:', error);
    return [];
  }
}

export async function createSample(data) {
  return kitchenApi.sample.create(data);
}

export async function updateSample(id, data) {
  return kitchenApi.sample.update(id, data);
}

export async function processSample(id, data) {
  return kitchenApi.sample.process(id, data);
}

// ============================================
// SHIFT CLOSINGS (CHỐT CA)
// ============================================

export async function fetchShiftClosings(params = {}) {
  try {
    const response = await kitchenApi.shiftClosing.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching shift closings:', error);
    return [];
  }
}

export async function createShiftClosing(data) {
  return kitchenApi.shiftClosing.create(data);
}

export async function confirmShiftClosing(id, data = {}) {
  return kitchenApi.shiftClosing.confirm(id, data);
}

export async function approveShiftClosing(id, data = {}) {
  return kitchenApi.shiftClosing.approve(id, data);
}

export async function reopenShiftClosing(id, data) {
  return kitchenApi.shiftClosing.reopen(id, data);
}

// ============================================
// DASHBOARD DATA
// ============================================

export async function fetchDashboardSummary(params = {}) {
  try {
    return await kitchenApi.dashboard.getSummary(params);
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return null;
  }
}

export async function fetchKitchenHistory(params = {}) {
  try {
    const response = await kitchenApi.dashboard.getHistory(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
}

export async function fetchMealFlowReport(params = {}) {
  try {
    return await kitchenApi.dashboard.getMealFlowReport(params);
  } catch (error) {
    console.error('Error fetching meal flow report:', error);
    return null;
  }
}

export async function fetchOperationsReport(params = {}) {
  try {
    return await kitchenApi.dashboard.getOperationsReport(params);
  } catch (error) {
    console.error('Error fetching operations report:', error);
    return null;
  }
}

// ============================================
// COMBINED DATA SERVICE (cho Dashboard)
// ============================================

export async function getKitchenDashboardData(params = {}) {
  const { date = getCurrentDate(), shift } = params;

  try {
    // Fetch all data in parallel
    const [summary, batches, imports, exports, inventory] = await Promise.all([
      fetchDashboardSummary({ date, shift }),
      fetchBatches({ date, stationId: params.stationId }),
      fetchFinishedImports({ date, shift }),
      fetchFinishedExports({ date, shift }),
      fetchFinishedInventory({ date, shift }),
    ]);

    return {
      summary,
      batches,
      imports,
      exports,
      inventory,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

// ============================================
// MEAL FLOW STATE (cho MealFlowPages)
// ============================================

export async function getMealFlowState(params = {}) {
  const { date = getCurrentDate(), shift } = params;

  try {
    const [batches, imports, exports, inventory, samples] = await Promise.all([
      fetchBatches({ date, shift }),
      fetchFinishedImports({ date, shift }),
      fetchFinishedExports({ date, shift }),
      fetchFinishedInventory({ date, shift }),
      fetchSamples({ date, shift }),
    ]);

    return {
      batches,
      importRows: imports,
      exportRows: exports,
      inventoryRows: inventory,
      sampleRows: samples,
      dishList: [], // Cần fetch riêng từ products API
    };
  } catch (error) {
    console.error('Error fetching meal flow state:', error);
    throw error;
  }
}

// ============================================
// PRODUCTS & DISHES
// ============================================

export async function fetchKitchenProducts() {
  try {
    const response = await kitchenApi.product.list({
      productType: 'FINISHED_GOOD',
      isActive: true,
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function fetchIngredients() {
  try {
    const response = await kitchenApi.product.list({
      productType: 'INGREDIENT',
      isActive: true,
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching ingredients:', error);
    return [];
  }
}

// ============================================
// STATIONS & ASSIGNMENTS
// ============================================

export async function fetchStations() {
  try {
    const response = await kitchenApi.station.list();
    return response.data || [];
  } catch (error) {
    console.error('Error fetching stations:', error);
    return [];
  }
}

export async function fetchAssignments(params = {}) {
  try {
    const response = await kitchenApi.assignment.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
}

// ============================================
// RECIPES
// ============================================

export async function fetchRecipes(productId) {
  try {
    const response = await kitchenApi.recipe.list({ productId });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return [];
  }
}

export async function createRecipe(data) {
  return kitchenApi.recipe.create(data);
}

export async function updateRecipe(id, data) {
  return kitchenApi.recipe.update(id, data);
}

export async function activateRecipe(id) {
  return kitchenApi.recipe.activate(id);
}

// ============================================
// CONSUMPTION & DEMAND
// ============================================

export async function fetchConsumptionSessions(params = {}) {
  try {
    const response = await kitchenApi.consumption.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching consumption sessions:', error);
    return [];
  }
}

export async function createConsumptionSession(data) {
  return kitchenApi.consumption.create(data);
}

export async function confirmConsumptionSession(id, data = {}) {
  return kitchenApi.consumption.confirm(id, data);
}

export async function fetchIngredientDemand(params = {}) {
  try {
    return await kitchenApi.consumption.getDemand(params);
  } catch (error) {
    console.error('Error fetching demand:', error);
    return null;
  }
}

// ============================================
// TICKETS
// ============================================

export async function fetchTickets(params = {}) {
  try {
    const response = await kitchenApi.ticket.list(params);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
}

export async function startTicket(id) {
  return kitchenApi.ticket.start(id);
}

export async function readyTicket(id) {
  return kitchenApi.ticket.ready(id);
}
