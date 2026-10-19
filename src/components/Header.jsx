import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import useSiteSettings from '../hooks/useSiteSettings';
import { resolveImageUrl } from '../utils/constants';
import SearchBar from './SearchBar';
import ThemeToggle from './ThemeToggle';

// مسافة التمرير (بالبكسل) التي يكتمل خلالها تقليص الهيدر بالكامل.
const SCROLL_RANGE = 220;

// رأس الصفحة: منطقة علوية تحتوي زر البحث (يمين) وزر الوضع (يسار)،
// وبلوك تسويقي فوق الشعار يتقلّص مع التمرير، وشعار ينزلق لموضعه الطبيعي.
export default function Header() {
  const { t } = useTranslation();
  const { settings } = useSiteSettings();
  const logoUrl = settings?.logoUrl?.trim() ? resolveImageUrl(settings.logoUrl) : '';

  const headerRef = useRef(null);
  const heroRef = useRef(null);

  // إذا فشل تحميل صورة الشعار نعرض الاسم النصي بدل صورة مكسورة.
  const [logoFailed, setLogoFailed] = useState(false);
  useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  // ===== قياس ارتفاع الهيدر المضغوط =====
  // نقيس (ارتفاع الهيدر − ارتفاع البلوك التسويقي) وهو ثابت مهما تغيّر
  // تقدّم التمرير، ونضعه في --header-compact فتتبع مسافة المحتوى الهيدر
  // بدقة مهما تغيّر حجم الشعار أو التفّ النص.
  const syncCompact = useCallback(() => {
    const header = headerRef.current;
    const hero = heroRef.current;
    if (!header || !hero) return;
    const compact = Math.round(header.offsetHeight - hero.offsetHeight);
    if (compact > 0) {
      document.documentElement.style.setProperty('--header-compact', `${compact}px`);
    }
  }, []);

  useLayoutEffect(() => {
    syncCompact();
    if (document.fonts?.ready) document.fonts.ready.then(syncCompact).catch(() => {});
    window.addEventListener('resize', syncCompact);
    return () => window.removeEventListener('resize', syncCompact);
  }, [syncCompact]);

  // إعادة القياس عند تغيّر الشعار (تحميل/فشل) لأنه يؤثّر على ارتفاع الهيدر.
  useEffect(() => {
    syncCompact();
  }, [logoUrl, logoFailed, syncCompact]);

  // ===== ربط الهيدر بالتمرير (Scroll-linked) =====
  // نكتب تقدّم التمرير (0 → 1) في متغيّر CSS واحد --p على <html>، وكل
  // حركات الهيدر مشتقّة منه في CSS — فالحركة ملتصقة بالتمرير لحظياً
  // (Scrubbed) وسلسة، لا انتقال منفصل يبدو مقطوعاً.
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    let last = -1;

    const update = () => {
      frame = 0;
      const p = Math.min(Math.max(window.scrollY / SCROLL_RANGE, 0), 1);
      if (p !== last) {
        last = p;
        root.style.setProperty('--p', p.toFixed(4));
      }
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
      root.style.removeProperty('--p');
    };
  }, []);

  return (
    <header ref={headerRef} className="glass-header fixed inset-x-0 top-0 z-40">
      <SearchBar />

      {/* زر تبديل الوضع (الثيم) الخاص بالمستخدم — على يسار الشريط بمقابل زر البحث */}
      <div className="absolute left-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-4 pt-9 sm:pt-10">
        {/* ===== البلوك التسويقي (فوق الشعار) =====
            يتقلّص ويتلاشى مع التمرير، وجمله الجانبية تنزلق نحو المنتصف. */}
        <div ref={heroRef} className="header-hero" aria-hidden="true">
          <span className="header-hero__side header-hero__side--start">
            {t('header.sideStart')}
          </span>
          <span className="header-hero__side header-hero__side--end">
            {t('header.sideEnd')}
          </span>

          {/* بادج مستطيل يحمل رسالة الثقة */}
          <span className="header-hero__badge">{t('header.badge')}</span>

          <p className="header-hero__title">{t('header.promoTitle')}</p>
          <p className="header-hero__sub">{t('header.promoSub')}</p>
        </div>

        {/* ===== الشعار =====
            يبدأ من حافة الهيدر (أسفل البلوك التسويقي) ثم يصعد لموضعه
            الطبيعي، مع ظهور تدريجي متصل بالتمرير. */}
        <Link to="/about" className="header-logo group flex flex-col items-center">
          {logoUrl && !logoFailed ? (
            <>
              {/* إطار رقيق متدرّج بلون الهوية حول الشعار */}
              <span className="logo-ring inline-flex transition-transform duration-300 group-hover:scale-105">
                <img
                  src={logoUrl}
                  alt="شعار بي نيشتي"
                  onLoad={syncCompact}
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
      </div>

      {/* خط ضوئي خفيف أسفل الهيدر */}
      <div className="header-glow-line" aria-hidden="true" />
    </header>
  );
}
