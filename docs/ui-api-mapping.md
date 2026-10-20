/**
 * UI-API MAPPING
 * Ghép các màn hình UI với Backend API Endpoints
 * ============================================
 */

const UI_API_MAPPING = {
  // ============================================
  // DASHBOARD
  // ============================================
  'DashboardPage': {
    component: 'src/page/DashboardPage.jsx',
    dataFlow: [
      {
        ui: 'DashboardStatGrid (stats)',
        api: 'dashboardApi.getSummary()',
        endpoint: 'GET /kitchen/dashboard',
        params: { date, shift },
      },
      {
        ui: 'CookingList',
        api: 'batchApi.list()',
        endpoint: 'GET /kitchen/batches',
        params: { date, shift },
      },
    ],
    actions: [],
  },

  // ============================================
  // KITCHEN PLAN
  // ============================================
  'KitchenPlanTodayPage': {
    component: 'src/page/KitchenPlanTodayPage.jsx',
    dataFlow: [
      {
        ui: 'TodayPlanTable',
        api: 'mealPlanApi.list()',
        endpoint: 'GET /kitchen/meal-plans',
        params: { date, mealPeriod, shift, status },
      },
      {
        ui: 'PlanSummaryCards',
        api: 'Tính toán từ mealPlans',
        computed: true,
      },
    ],
    actions: [
      {
        ui: 'PlanForm.onSubmit -> savePlan()',
        api: 'mealPlanApi.create() / mealPlanApi.update()',
        endpoints: ['POST /kitchen/meal-plans', 'PUT /kitchen/meal-plans/:id'],
      },
      {
        ui: 'TodayPlanTable.onConfirm -> confirmPlan()',
        api: 'mealPlanApi.lock()',
        endpoint: 'POST /kitchen/meal-plans/:id/lock',
      },
    ],
  },

  'KitchenMenuPage': {
    component: 'src/page/KitchenMenuPage.jsx',
    dataFlow: [
      {
        ui: 'MenuTable',
        api: 'menuApi.list()',
        endpoint: 'GET /kitchen/menus',
        params: { date, mealPeriod, shift },
      },
    ],
    actions: [
      {
        ui: 'MenuForm.onSubmit -> saveMenu()',
        api: 'menuApi.create() / menuApi.update()',
        endpoints: ['POST /kitchen/menus', 'PUT /kitchen/menus/:id'],
      },
      {
        ui: 'MenuTable.onLock -> lockMenu()',
        api: 'menuApi.lock()',
        endpoint: 'POST /kitchen/menus/:id/lock',
      },
      {
        ui: 'MenuTable.onCopy -> copyMenu()',
        api: 'menuApi.copy()',
        endpoint: 'POST /kitchen/menus/:id/copy',
      },
    ],
  },

  // ============================================
  // COOKING TRACKING
  // ============================================
  'CookingTrackingPage': {
    component: 'src/page/CookingTrackingPage.jsx',
    dataFlow: [
      {
        ui: 'TrackingTable',
        api: 'batchApi.list()',
        endpoint: 'GET /kitchen/batches',
        params: { date, mealPeriod, shift, status },
      },
    ],
    actions: [
      {
        ui: 'TrackingTable.onStart -> startCooking()',
        api: 'batchApi.start()',
        endpoint: 'POST /kitchen/batches/:id/preparing',
      },
      {
        ui: 'TrackingTable.onComplete -> completeCooking()',
        api: 'batchApi.complete()',
        endpoint: 'POST /kitchen/batches/:id/completed',
      },
      {
        ui: 'TrackingForm.onSubmit -> saveTracking()',
        api: 'batchApi.update()',
        endpoint: 'PUT /kitchen/batches/:id',
      },
    ],
  },

  // ============================================
  // MEAL FLOW - IMPORT
  // ============================================
  'MealImportPage': {
    component: 'src/page/MealFlowPages.jsx (exported MealImportPage)',
    dataFlow: [
      {
        ui: 'MealImportTable',
        api: 'finishedImportApi.list()',
        endpoint: 'GET /kitchen/finished-imports',
        params: { date, shift, status },
      },
      {
        ui: 'SummaryCards (candidates)',
        api: 'Tính toán từ batches COMPLETED - imports',
        computed: true,
      },
    ],
    actions: [
      {
        ui: 'MealImportForm.onSubmit -> saveImport()',
        api: 'finishedImportApi.create()',
        endpoint: 'POST /kitchen/finished-imports',
      },
      {
        ui: 'MealImportTable.onConfirm -> confirmImport()',
        api: 'finishedImportApi.confirm()',
        endpoint: 'POST /kitchen/finished-imports/:id/confirm',
      },
    ],
  },

  // ============================================
  // MEAL FLOW - EXPORT
  // ============================================
  'MealExportPage': {
    component: 'src/page/MealFlowPages.jsx (exported MealExportPage)',
    dataFlow: [
      {
        ui: 'MealExportTable',
        api: 'finishedExportApi.list()',
        endpoint: 'GET /kitchen/finished-exports',
        params: { date, shift, status },
      },
      {
        ui: 'SummaryCards (availableInventory)',
        api: 'finishedInventoryApi.list()',
        endpoint: 'GET /kitchen/finished-inventory',
        params: { date, status: 'AVAILABLE' },
      },
    ],
    actions: [
      {
        ui: 'MealExportForm.onSubmit -> saveExport()',
        api: 'finishedExportApi.create()',
        endpoint: 'POST /kitchen/finished-exports',
      },
      {
        ui: 'MealExportTable.onRecall -> recallExport()',
        api: 'finishedExportApi.returns()',
        endpoint: 'POST /kitchen/finished-exports/:id/returns',
      },
    ],
  },

  // ============================================
  // MEAL FLOW - INVENTORY
  // ============================================
  'MealInventoryPage': {
    component: 'src/page/MealFlowPages.jsx (exported MealInventoryPage)',
    dataFlow: [
      {
        ui: 'MealInventoryTable',
        api: 'finishedInventoryApi.list()',
        endpoint: 'GET /kitchen/finished-inventory',
        params: { date, status },
      },
    ],
    actions: [
      {
        ui: 'MealInventoryTable.onEdit -> saveInventoryEdit()',
        api: 'finishedImportApi.update()',
        endpoint: 'PUT /kitchen/finished-imports/:id',
      },
      {
        ui: 'MealInventoryTable.onExport -> saveExport()',
        api: 'finishedExportApi.create()',
        endpoint: 'POST /kitchen/finished-exports',
      },
    ],
  },

  // ============================================
  // MEAL FLOW - HISTORY
  // ============================================
  'MealHistoryPage': {
    component: 'src/page/MealFlowPages.jsx (exported MealHistoryPage)',
    dataFlow: [
      {
        ui: 'MealHistoryTable',
        api: 'dashboardApi.getHistory()',
        endpoint: 'GET /kitchen/history',
        params: { date, from, to, shift },
      },
    ],
    actions: [],
  },

  // ============================================
  // MEAL CANCEL
  // ============================================
  'MealCancelPage': {
    component: 'src/page/MealCancelPage.jsx',
    dataFlow: [
      {
        ui: 'MealCancelSourceTable',
        api: 'finishedInventoryApi.list()',
        endpoint: 'GET /kitchen/finished-inventory',
        params: { date, status: 'REMAINING' },
      },
      {
        ui: 'MealHistoryTable (cancelHistoryRows)',
        api: 'disposalApi.list()',
        endpoint: 'GET /kitchen/disposals',
        params: { date },
      },
    ],
    actions: [
      {
        ui: 'MealCancelForm.onSubmit -> saveCancel()',
        api: 'disposalApi.create()',
        endpoint: 'POST /kitchen/disposals',
      },
    ],
  },

  // ============================================
  // MEAL SAMPLE
  // ============================================
  'MealSampleManagePage': {
    component: 'src/page/MealSampleManagePage.jsx',
    dataFlow: [
      {
        ui: 'MealSampleTable',
        api: 'sampleApi.list()',
        endpoint: 'GET /kitchen/samples',
        params: { date, status },
      },
    ],
    actions: [
      {
        ui: 'MealSampleForm.onSubmit -> saveSample()',
        api: 'sampleApi.create() / sampleApi.update()',
        endpoints: ['POST /kitchen/samples', 'PUT /kitchen/samples/:id'],
      },
      {
        ui: 'MealSampleTable.onProcess -> processSample()',
        api: 'sampleApi.process()',
        endpoint: 'POST /kitchen/samples/:id/process',
      },
    ],
  },

  // ============================================
  // SHIFT SUMMARY
  // ============================================
  'ShiftSummaryPage': {
    component: 'src/page/ShiftSummaryPage.jsx',
    dataFlow: [
      {
        ui: 'ShiftReportTable',
        api: 'shiftClosingApi.list() + dashboardApi.getSummary()',
        endpoints: ['GET /kitchen/shift-closings', 'GET /kitchen/dashboard'],
        params: { date, shift },
      },
    ],
    actions: [
      {
        ui: 'ShiftConfirmPanel.onConfirm -> confirmShift()',
        api: 'shiftClosingApi.confirm()',
        endpoint: 'POST /kitchen/shift-closings/:id/confirm',
      },
      {
        ui: 'ShiftConfirmPanel.onApprove -> approveShift()',
        api: 'shiftClosingApi.approve()',
        endpoint: 'POST /kitchen/shift-closings/:id/approve',
      },
      {
        ui: 'ShiftConfirmPanel.onUnlock -> unlockShift()',
        api: 'shiftClosingApi.reopen()',
        endpoint: 'POST /kitchen/shift-closings/:id/reopen',
      },
    ],
  },

  // ============================================
  // REPORTS
  // ============================================
  'ReportsPage': {
    component: 'src/page/ReportsPage.jsx',
    dataFlow: [
      {
        ui: 'ReportTable',
        api: 'dashboardApi.getHistory()',
        endpoint: 'GET /kitchen/history',
        params: { date, type, dish },
      },
    ],
    actions: [],
  },
};

// ============================================
// ENDPOINT REFERENCE
// ============================================

const ENDPOINT_REFERENCE = {
  // KitchenController
  'GET /kitchen/menus': { service: 'KitchenOperationsService', method: 'getMenus' },
  'POST /kitchen/menus': { service: 'KitchenOperationsService', method: 'createMenu' },
  'GET /kitchen/menus/:id': { service: 'KitchenOperationsService', method: 'getMenu' },
  'PUT /kitchen/menus/:id': { service: 'KitchenOperationsService', method: 'updateMenu' },
  'POST /kitchen/menus/:id/lock': { service: 'KitchenOperationsService', method: 'lockMenu' },

  // MealPlans
  'GET /kitchen/meal-plans': { service: 'KitchenOperationsService', method: 'getMealPlans' },
  'POST /kitchen/meal-plans': { service: 'KitchenOperationsService', method: 'createMealPlan' },
  'GET /kitchen/meal-plans/:id': { service: 'KitchenOperationsService', method: 'getMealPlan' },
  'PUT /kitchen/meal-plans/:id': { service: 'KitchenOperationsService', method: 'updateMealPlan' },
  'POST /kitchen/meal-plans/:id/lock': { service: 'KitchenOperationsService', method: 'lockMealPlan' },
  'POST /kitchen/meal-plans/:id/adjustments': { service: 'KitchenOperationsService', method: 'addAdjustment' },

  // Batches
  'GET /kitchen/batches': { service: 'KitchenOperationsService', method: 'getBatches' },
  'PUT /kitchen/batches/:id': { service: 'KitchenOperationsService', method: 'updateBatch' },
  'POST /kitchen/batches/:id/preparing': { service: 'KitchenOperationsService', method: 'startBatch' },
  'POST /kitchen/batches/:id/ready': { service: 'KitchenOperationsService', method: 'readyBatch' },
  'POST /kitchen/batches/:id/completed': { service: 'KitchenOperationsService', method: 'completeBatch' },

  // Finished Imports
  'GET /kitchen/finished-imports': { service: 'KitchenOperationsService', method: 'getFinishedImports' },
  'POST /kitchen/finished-imports': { service: 'KitchenOperationsService', method: 'createFinishedImport' },
  'PUT /kitchen/finished-imports/:id': { service: 'KitchenOperationsService', method: 'updateFinishedImport' },
  'POST /kitchen/finished-imports/:id/confirm': { service: 'KitchenOperationsService', method: 'confirmFinishedImport' },

  // Finished Exports
  'GET /kitchen/finished-exports': { service: 'KitchenOperationsService', method: 'getFinishedExports' },
  'POST /kitchen/finished-exports': { service: 'KitchenOperationsService', method: 'createFinishedExport' },
  'POST /kitchen/finished-exports/:id/returns': { service: 'KitchenOperationsService', method: 'returnFinishedExport' },

  // Finished Inventory
  'GET /kitchen/finished-inventory': { service: 'KitchenOperationsService', method: 'getFinishedInventory' },
  'POST /kitchen/finished-inventory/:id/adjustments': { service: 'KitchenOperationsService', method: 'adjustFinishedInventory' },
  'POST /kitchen/finished-inventory/:id/release': { service: 'KitchenOperationsService', method: 'releaseFinishedInventory' },

  // Disposals
  'GET /kitchen/disposals': { service: 'KitchenOperationsService', method: 'getDisposals' },
  'POST /kitchen/disposals': { service: 'KitchenOperationsService', method: 'createDisposal' },
  'POST /kitchen/disposals/:id/confirm-disposal': { service: 'KitchenOperationsService', method: 'confirmDisposal' },

  // Samples
  'GET /kitchen/samples': { service: 'KitchenOperationsService', method: 'getSamples' },
  'POST /kitchen/samples': { service: 'KitchenOperationsService', method: 'createSample' },
  'PUT /kitchen/samples/:id': { service: 'KitchenOperationsService', method: 'updateSample' },
  'POST /kitchen/samples/:id/process': { service: 'KitchenOperationsService', method: 'processSample' },

  // Shift Closings
  'GET /kitchen/shift-closings': { service: 'KitchenOperationsService', method: 'getShiftClosings' },
  'POST /kitchen/shift-closings': { service: 'KitchenOperationsService', method: 'createShiftClosing' },
  'POST /kitchen/shift-closings/:id/confirm': { service: 'KitchenOperationsService', method: 'confirmShiftClosing' },
  'POST /kitchen/shift-closings/:id/approve': { service: 'KitchenOperationsService', method: 'approveShiftClosing' },
  'POST /kitchen/shift-closings/:id/reopen': { service: 'KitchenOperationsService', method: 'reopenShiftClosing' },

  // Dashboard
  'GET /kitchen/dashboard': { service: 'KitchenOperationsService', method: 'getDashboard' },
  'GET /kitchen/history': { service: 'KitchenOperationsService', method: 'getHistory' },
  'GET /kitchen/reports/meal-flow': { service: 'KitchenOperationsService', method: 'getMealFlowReport' },
  'GET /kitchen/reports/operations': { service: 'KitchenOperationsService', method: 'getOperationsReport' },

  // KitchenController (Tickets)
  'GET /kitchen/tickets': { service: 'KitchenService', method: 'getTickets' },
  'GET /kitchen/tickets/:id': { service: 'KitchenService', method: 'getTicket' },
  'POST /kitchen/tickets/:id/start': { service: 'KitchenService', method: 'startTicket' },
  'POST /kitchen/tickets/:id/ready': { service: 'KitchenService', method: 'readyTicket' },

  // KitchenController (Recipes)
  'GET /kitchen/recipes': { service: 'KitchenService', method: 'getRecipes' },
  'POST /kitchen/recipes': { service: 'KitchenService', method: 'createRecipe' },
  'PUT /kitchen/recipes/:id': { service: 'KitchenService', method: 'updateRecipe' },
  'POST /kitchen/recipes/:id/activate': { service: 'KitchenService', method: 'activateRecipe' },

  // KitchenController (Consumption)
  'GET /kitchen/consumption-sessions': { service: 'KitchenService', method: 'getConsumptionSessions' },
  'POST /kitchen/consumption-sessions': { service: 'KitchenService', method: 'createConsumptionSession' },
  'POST /kitchen/consumption-sessions/:id/confirm': { service: 'KitchenService', method: 'confirmConsumptionSession' },
  'GET /kitchen/demand': { service: 'KitchenService', method: 'getDemand' },

  // KitchenController (Stations)
  'GET /kitchen/stations': { service: 'KitchenService', method: 'getStations' },
  'POST /kitchen/stations': { service: 'KitchenService', method: 'createStation' },
  'PUT /kitchen/stations/:id': { service: 'KitchenService', method: 'updateStation' },
  'DELETE /kitchen/stations/:id': { service: 'KitchenService', method: 'deactivateStation' },
  'PUT /kitchen/stations/:id/products': { service: 'KitchenService', method: 'assignProductsToStation' },

  // KitchenController (Assignments)
  'GET /kitchen/assignments': { service: 'KitchenService', method: 'getAssignments' },
  'POST /kitchen/assignments': { service: 'KitchenService', method: 'createAssignment' },
};

export { UI_API_MAPPING, ENDPOINT_REFERENCE };
export default UI_API_MAPPING;
