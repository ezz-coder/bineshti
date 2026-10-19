import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { IconBuilding, IconHome, IconInfo, IconLand, IconVilla } from './icons';

// عناصر الـ Dock من اليمين إلى اليسار.
const ITEMS = [
  { to: '/', labelKey: 'nav.home', Icon: IconHome, end: true },
  { to: '/apartments', labelKey: 'nav.apartments', Icon: IconBuilding },
  { to: '/villas', labelKey: 'nav.villas', Icon: IconVilla },
  { to: '/lands', labelKey: 'nav.lands', Icon: IconLand },
  { to: '/about', labelKey: 'nav.about', Icon: IconInfo },
];

// شريط التنقل السفلي الثابت (Fixed Bottom) لجميع الصفحات.
export default function BottomDock() {
  const { t } = useTranslation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="glass-effect mx-auto flex max-w-lg items-stretch justify-between gap-1 rounded-card border border-border-glow/40 bg-dock-bg px-2 py-2 shadow-lg backdrop-blur">
        {ITEMS.map(({ to, labelKey, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-0.5 py-2 transition-all duration-300 ${
                isActive
                  ? 'bg-accent/15 text-accent shadow-glow'
                  : 'text-muted hover:bg-accent/5 hover:text-primary-glow'
              }`
            }
          >
            <Icon className="h-6 w-6 shrink-0" />
            <span className="w-full text-center text-[10px] font-semibold leading-tight sm:text-xs">
              {t(labelKey)}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
