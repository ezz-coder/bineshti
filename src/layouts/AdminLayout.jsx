import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import {
  IconBuilding,
  IconClose,
  IconHome,
  IconHouse,
  IconLand,
  IconLogout,
  IconMenu,
  IconSettings,
  IconVilla,
} from '../components/icons';
import { removeToken } from '../services/api';
import { APP_NAME } from '../utils/constants';

// عناصر القائمة المشتركة بين السايدبار والدروَر والتنقل السفلي.
const navItems = [
  { to: '/admin', label: 'الرئيسية', Icon: IconHome, end: true },
  { to: '/admin/apartments', label: 'إدارة الشقق', Icon: IconBuilding },
  { to: '/admin/villas', label: 'إدارة الفلل', Icon: IconVilla },
  { to: '/admin/houses', label: 'إدارة البيوت', Icon: IconHouse },
  { to: '/admin/lands', label: 'إدارة الأراضي', Icon: IconLand },
  { to: '/admin/settings', label: 'الإعدادات', Icon: IconSettings },
];

function NavItem({ to, label, Icon, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
          isActive
            ? 'bg-accent text-white'
            : 'text-dark-gray/70 hover:bg-soft-blue hover:text-dark-gray'
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // إغلاق الدروَر عند تغيير المسار.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    removeToken();
    window.location.assign('/admin/login');
  }

  return (
    <div className="flex min-h-screen bg-soft-beige" dir="rtl">
      {/* ===== السايدبار (شاشات كبيرة) ===== */}
      <aside className="glass-card sticky top-0 hidden h-screen w-64 shrink-0 flex-col p-4 lg:flex">
        <div className="mb-6 px-2 pt-2">
          <h2 className="text-lg font-bold text-dark-gray">لوحة التحكم</h2>
          <p className="mt-1 text-xs text-dark-gray/50">{APP_NAME}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition-all duration-300 hover:bg-red-500/15"
        >
          <IconLogout className="h-5 w-5" />
          <span>تسجيل الخروج</span>
        </button>
      </aside>

      {/* ===== المحتوى الرئيسي ===== */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-header sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="فتح القائمة"
            className="rounded-xl p-2 text-dark-gray transition-all duration-300 hover:bg-soft-blue"
          >
            <IconMenu className="h-6 w-6" />
          </button>
          <span className="text-base font-bold text-dark-gray">لوحة التحكم</span>
          <span className="w-10" aria-hidden="true" />
        </header>

        <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-24 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* ===== شريط تنقل سفلي (الموبايل) ===== */}
      <nav className="glass-header fixed inset-x-0 bottom-0 z-30 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-all duration-300 ${
                  isActive ? 'text-accent' : 'text-dark-gray/50'
                }`
              }
            >
              <item.Icon className="h-5 w-5" />
              <span>{item.label.replace('إدارة ', '')}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-red-500"
          >
            <IconLogout className="h-5 w-5" />
            <span>خروج</span>
          </button>
        </div>
      </nav>

      {/* ===== الدروَر (قائمة منزلقة للموبايل) ===== */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-dark-gray/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="glass-card absolute inset-y-0 right-0 flex w-72 flex-col p-4">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold text-dark-gray">القائمة</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="إغلاق القائمة"
                className="rounded-lg p-1 text-dark-gray/50 transition-all duration-300 hover:bg-soft-blue"
              >
                <IconClose className="h-6 w-6" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1">
              {navItems.map((item) => (
                <NavItem key={item.to} {...item} onClick={() => setDrawerOpen(false)} />
              ))}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 transition-all duration-300 hover:bg-red-500/15"
            >
              <IconLogout className="h-5 w-5" />
              <span>تسجيل الخروج</span>
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}