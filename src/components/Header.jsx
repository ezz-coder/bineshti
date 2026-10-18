import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import useSiteSettings from '../hooks/useSiteSettings';
import { resolveImageUrl } from '../utils/constants';
import SearchBar from './SearchBar';

// المنطقة العلوية: بحث (يمين) + لوغو ديناميكي في المنتصف (يوجه إلى /about).
// يعرض صورة الشعار من الإعدادات إن وُجدت، وإلا يعرض النص الافتراضي.
export default function Header() {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();
  const logoUrl = settings?.logoUrl?.trim() ? resolveImageUrl(settings.logoUrl) : '';

  // إذا فشل تحميل صورة الشعار (الملف مفقود على السيرفر مثلاً) نعرض الاسم النصي
  // بدل صورة مكسورة، ونُعيد المحاولة تلقائياً عند تغيّر رابط الشعار.
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  return (
    <header className="glass-header fixed inset-x-0 top-0 z-40">
      <SearchBar />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-6 pt-14 sm:pt-16">
        <Link to="/about" className="group flex flex-col items-center">
          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt="شعار بي نيشتي"
              onError={() => setLogoFailed(true)}
              className="h-14 w-14 rounded-full border-2 border-accent/50 bg-white object-contain p-1 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:opacity-90 group-hover:border-accent sm:h-20 sm:w-20"
            />
          ) : (
            <span className="text-lg font-extrabold tracking-tight text-dark-gray transition-colors duration-200 group-hover:text-accent sm:text-3xl">
              {t('site.short')}
            </span>
          )}
          <span className="mt-1 text-xs font-medium text-dark-gray/60 sm:text-sm">
            {t('site.tagline')}
          </span>
        </Link>
      </div>
      {/* خط ضوئي خفيف أسفل الهيدر */}
      <div className="header-glow-line" aria-hidden="true" />
    </header>
  );
}
