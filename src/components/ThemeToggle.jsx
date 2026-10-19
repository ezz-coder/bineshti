import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getAppliedTheme, setUserTheme } from '../utils/theme';
import { IconMoon, IconSun } from './icons';

// زر تبديل الوضع (الثيم) الخاص بالمستخدم في الهيدر — على يسار الشريط بمقابل زر البحث.
// يبدّل الوضع للزائر نفسه فقط (يُحفظ محلياً تحت user-theme) دون تغيير الوضع الرئيسي للموقع.
// أيقونة قمر للوضع الداكن، وشمس للوضع الدافئ، مع نص صغير تحته يوضّح الوضع الحالي.
export default function ThemeToggle() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(getAppliedTheme);

  // متابعة أي تغيير فعلي على data-theme (من الزر أو من ثيم الأدمن) لتحديث الأيقونة والنص.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getAppliedTheme());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  const isDark = theme !== 'warm';

  const handleToggle = () => {
    setUserTheme(isDark ? 'warm' : 'dark');
  };

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={handleToggle}
        aria-label={t('theme.toggle')}
        title={isDark ? t('theme.dark') : t('theme.warm')}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-dark-gray shadow-md ring-1 ring-dark-gray/10 transition-all duration-300 hover:text-accent active:scale-95 sm:h-11 sm:w-11"
      >
        {isDark ? <IconMoon /> : <IconSun />}
      </button>
      <span className="mt-1.5 whitespace-nowrap text-[10px] font-semibold text-dark-gray/70 sm:text-xs">
        {isDark ? t('theme.dark') : t('theme.warm')}
      </span>
    </div>
  );
}
