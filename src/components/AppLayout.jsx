import { useAuth } from "../auth/authContext";
import { useEffect, useMemo, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
  X,
} from "lucide-react";
import { LOGIN_TOAST_KEY } from "../auth/authContext";
import { isNavigationItemActive, navigationItems, systemBrand } from "../datas/navigation";
import logoImage from "../assets/Image/logo5.jpg";

function getLoginToast() {
  const message = sessionStorage.getItem(LOGIN_TOAST_KEY);

  if (message) {
    sessionStorage.removeItem(LOGIN_TOAST_KEY);
  }

  return message;
}

function getInitialOpenGroups(pathname) {
  return navigationItems.reduce((groups, item) => {
    const hasActiveChild = item.children?.some(
      (child) => pathname === child.path,
    );

    if (hasActiveChild) {
      return { ...groups, [item.label]: true };
    }

    return groups;
  }, {});
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const { session, logout } = useAuth();
  const currentStaff = {
    ...session,
    role:
      { HEAD_CHEF: "Bếp trưởng", KITCHEN: "Nhân viên bếp" }[
        session?.userType
      ] || session?.userType,
    station: session?.branchName || "Chọn chi nhánh",
  };
  const [toastMessage, setToastMessage] = useState(getLoginToast);
  const [openGroups, setOpenGroups] = useState(() =>
    getInitialOpenGroups(location.pathname),
  );
  const BrandIcon = systemBrand.icon;
  const currentPage = useMemo(() => {
    const parent = navigationItems.find((item) => {
      if (isNavigationItemActive(item, location.pathname)) {
        return true;
      }

      return item.children?.some((child) => child.path === location.pathname);
    });

    return parent?.label || "Tổng quan";
  }, [location.pathname]);

  function toggleGroup(label) {
    setOpenGroups((currentGroups) => ({
      ...currentGroups,
      [label]: !currentGroups[label],
    }));
  }

  function closeMobileSidebar() {
    setIsMobileSidebarOpen(false);
  }

  function handleLogout() {
    setShowLogoutDialog(false);
    setIsMobileSidebarOpen(false);
    logout();
    navigate("/login");
  }

  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const toastTimer = window.setTimeout(() => {
      setToastMessage("");
    }, 3000);

    return () => window.clearTimeout(toastTimer);
  }, [toastMessage]);

  return (
    <div className="min-h-screen bg-sky-50 text-slate-900">
      {isMobileSidebarOpen ? (
        <button
          className="fixed inset-0 z-20 bg-slate-950/45 lg:hidden"
          type="button"
          aria-label="Đóng menu"
          onClick={closeMobileSidebar}
        />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gradient-to-b from-blue-950 via-blue-800 to-sky-500 px-3 py-4 text-white shadow-2xl shadow-blue-950/20 transition-all duration-300",
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64",
        ].join(" ")}
      >
        <div className="flex items-center gap-3 px-2 pb-5">
          <Link
            className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white"
            to="/dashboard"
            title={systemBrand.name}
          >
            <img
              className="size-full object-cover"
              src={logoImage}
              alt={systemBrand.name}
            />
          </Link>
          {!isCollapsed ? (
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-normal">
                {systemBrand.name}
              </h1>
              <p className="text-sm font-medium text-blue-100">
                {systemBrand.area}
              </p>
            </div>
          ) : null}
          <button
            className="ml-auto grid size-9 place-items-center rounded-lg text-blue-50 transition hover:bg-white/15 lg:hidden"
            type="button"
            aria-label="Đóng menu"
            onClick={closeMobileSidebar}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <button
          className="mb-4 hidden h-10 items-center justify-center gap-2 rounded-lg bg-white/10 px-3 text-sm font-semibold text-blue-50 transition hover:bg-white/20 lg:inline-flex"
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen size={19} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={19} aria-hidden="true" />
          )}
          {!isCollapsed ? <span>Thu gọn menu</span> : null}
        </button>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {navigationItems.map((item) => {
            if (
              item.path === "/dashboard/reports" &&
              session?.userType !== "HEAD_CHEF"
            ) return null;

            const Icon = item.icon;
            const hasChildren = Boolean(item.children?.length);
            const isGroupOpen = Boolean(openGroups[item.label]);

            if (!hasChildren) {
              const isActive = isNavigationItemActive(item, location.pathname);
              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={
                    [
                      "group relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition",
                      isActive
                        ? "bg-white text-blue-800 shadow-sm"
                        : "text-blue-50 hover:bg-white/12 hover:text-white",
                      isCollapsed ? "lg:justify-center" : "",
                    ].join(" ")
                  }
                  key={item.label}
                  onClick={closeMobileSidebar}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span className={isCollapsed ? "lg:hidden" : ""}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <div key={item.label}>
                <button
                  className={[
                    "group relative flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition",
                    "text-blue-50 hover:bg-white/12 hover:text-white",
                    isCollapsed ? "lg:justify-center" : "",
                  ].join(" ")}
                  type="button"
                  onClick={() => toggleGroup(item.label)}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={20} aria-hidden="true" />
                  <span
                    className={[
                      "min-w-0 flex-1 whitespace-normal leading-snug",
                      isCollapsed ? "lg:hidden" : "",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                  <span className={isCollapsed ? "lg:hidden" : ""}>
                    {isGroupOpen ? (
                      <ChevronDown size={17} aria-hidden="true" />
                    ) : (
                      <ChevronRight size={17} aria-hidden="true" />
                    )}
                  </span>
                </button>

                {isGroupOpen ? (
                  <div
                    className={[
                      "mt-1 space-y-1 pl-9",
                      isCollapsed ? "lg:hidden" : "",
                    ].join(" ")}
                  >
                    {item.children.map((child) => (
                      <NavLink
                        className={({ isActive }) =>
                          [
                            "block rounded-lg px-3 py-2 text-sm font-medium transition",
                            isActive
                              ? "bg-blue-50 text-blue-800"
                              : "text-blue-100 hover:bg-white/10 hover:text-white",
                          ].join(" ")
                        }
                        key={child.path}
                        end
                        onClick={closeMobileSidebar}
                        to={child.path}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <button
          className={[
            "mt-4 flex h-11 items-center gap-3 rounded-lg border border-white/15 bg-white/10 px-3 text-sm font-semibold text-white transition hover:border-red-200/60 hover:bg-red-100 hover:text-red-700",
            isCollapsed ? "lg:justify-center" : "",
          ].join(" ")}
          type="button"
          onClick={() => setShowLogoutDialog(true)}
          title={isCollapsed ? "Đăng xuất" : undefined}
        >
          <LogOut size={20} aria-hidden="true" />
          <span className={isCollapsed ? "lg:hidden" : ""}>Đăng xuất</span>
        </button>
      </aside>

      <div
        className={[
          "min-h-screen transition-all duration-300",
          isCollapsed ? "lg:pl-20" : "lg:pl-64",
        ].join(" ")}
      >
        <header
          className={[
            "fixed left-0 right-0 top-0 z-20 h-16 border-b border-blue-100 bg-white/95 shadow-sm shadow-blue-950/5 backdrop-blur transition-all duration-300 sm:h-20",
            isCollapsed ? "lg:left-20" : "lg:left-64",
          ].join(" ")}
        >
          <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <button
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-blue-100 text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 lg:hidden"
                type="button"
                aria-label="Mở menu"
                onClick={() => setIsMobileSidebarOpen(true)}
              >
                <Menu size={20} aria-hidden="true" />
              </button>
              <div className="hidden size-11 place-items-center rounded-xl bg-gradient-to-br from-blue-700 to-sky-400 text-white shadow-lg shadow-blue-700/20 sm:grid">
                <BrandIcon size={22} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                  <Menu
                    className="hidden sm:block"
                    size={16}
                    aria-hidden="true"
                  />
                  <span>{systemBrand.area}</span>
                </div>
                <h2 className="truncate text-lg font-bold tracking-normal text-slate-950 sm:text-2xl">
                  {currentPage}
                </h2>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <Link
                className="relative grid size-10 place-items-center rounded-xl border border-blue-100 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:size-11"
                to={
                  session.userType === "HEAD_CHEF"
                    ? "/dashboard/menu/recipes"
                    : "/dashboard/kitchen/tasks"
                }
                aria-label={
                  session.userType === "HEAD_CHEF"
                    ? "Thông báo yêu cầu công thức"
                    : "Thông báo nhiệm vụ bếp"
                }
              >
                <Bell size={20} aria-hidden="true" />
              </Link>

              <button
                className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white p-2 transition hover:border-blue-200 hover:bg-blue-50 sm:gap-3 sm:px-3"
                type="button"
              >
                <div className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-sky-400 text-white">
                  <UserRound size={20} aria-hidden="true" />
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-bold text-slate-900">
                    {currentStaff.fullName}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {currentStaff.role}
                  </p>
                </div>
                <ChevronDown
                  className="hidden text-slate-500 sm:block"
                  size={18}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 px-4 pb-6 pt-24 sm:px-6 sm:pb-8 sm:pt-28 lg:px-8">
          <Outlet />
        </main>
      </div>

      {showLogoutDialog ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4">
          <section className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl shadow-slate-950/25">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold tracking-normal text-slate-950">
                  Xác nhận đăng xuất
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
                </p>
              </div>
              <button
                className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                type="button"
                aria-label="Đóng"
                onClick={() => setShowLogoutDialog(false)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-7 flex justify-end gap-3">
              <button
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                type="button"
                onClick={() => setShowLogoutDialog(false)}
              >
                Hủy
              </button>
              <button
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                type="button"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="fixed right-4 top-20 z-50 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-2xl shadow-blue-950/15 sm:right-6 sm:top-24">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-full bg-blue-600 text-white">
              <UserRound size={17} aria-hidden="true" />
            </div>
            <div>
              <p>{toastMessage}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {currentStaff.role} - {currentStaff.station}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AppLayout;
