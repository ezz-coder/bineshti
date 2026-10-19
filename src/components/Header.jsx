import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import useSiteSettings from '../hooks/useSiteSettings';
import { resolveImageUrl } from '../utils/constants';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';

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

  // تقليص الهيدر تدريجياً عند التمرير: نقرأ موضع التمرير مرة واحدة لكل إطار
  // (requestAnimationFrame) ونبدّل حالة واحدة، ليتكفّل CSS بالانتقال الناعم
  // بدل الحساب مع كل حدث تمرير — أخف بكثير على الأداء.
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setCondensed(window.scrollY > 24);
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // الحالة تُوضع على <html> ليتحرّك ارتفاع الشريط التسويقي ومسافة المحتوى معاً.
  useEffect(() => {
    document.documentElement.classList.toggle('header-condensed', condensed);
  }, [condensed]);

  // تنظيف عند مغادرة الصفحات العامة (لوحة التحكم مثلاً) حتى لا تبقى الحالة.
  useEffect(
    () => () => document.documentElement.classList.remove('header-condensed'),
    []
  );

  return (
    <header className="glass-header fixed inset-x-0 top-0 z-40">
      <SearchBar />

      {/* زر تبديل الوضع (الثيم) الخاص بالمستخدم — على يسار الشريط بمقابل زر البحث */}
      <div className="absolute left-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-4 pt-8 sm:pt-10">
        <Link to="/about" className="group flex flex-col items-center">
          {logoUrl && !logoFailed ? (
            <>
              {/* إطار رقيق متدرّج بلون الهوية حول الشعار (بدل الحلقة البيضاء) */}
              <span className="logo-ring inline-flex transition-transform duration-300 group-hover:scale-105">
                <img
                  src={logoUrl}
                  alt="شعار بي نيشتي"
                  onError={() => setLogoFailed(true)}
                  className="h-20 w-20 rounded-full object-contain sm:h-24 sm:w-24"
                />
              </span>
              {/* اسم الموقع في سطر واحد أسفل الشعار */}
              <span className="mt-3 whitespace-nowrap text-sm font-bold tracking-tight text-dark-gray transition-colors duration-200 group-hover:text-accent sm:text-base">
                {t('site.name')}
              </span>
            </>
          ) : (
            <span className="whitespace-nowrap text-lg font-extrabold tracking-tight text-dark-gray transition-colors duration-200 group-hover:text-accent sm:text-3xl">
              {t('site.name')}
            </span>
          )}
        </Link>

        {/* الشريط التسويقي: يظهر أعلى الصفحة ثم يتقلّص تدريجياً عند النزول،
            ويبقى الشعار وزر البحث وزر الوضع في أماكنهم تماماً. */}
        <div
          className={`header-promo${condensed ? ' is-condensed' : ''}`}
          aria-hidden={condensed}
        >
          <p className="header-promo__title">{t('header.promoTitle')}</p>
          <p className="header-promo__sub">{t('header.promoSub')}</p>
        </div>
      </div>
      {/* خط ضوئي خفيف أسفل الهيدر */}
      <div className="header-glow-line" aria-hidden="true" />
    </header>
  );
}
