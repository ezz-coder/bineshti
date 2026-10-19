import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';

import BottomDock from '../components/BottomDock';
import Header from '../components/Header';

// ===== استعادة موضع التمرير =====
// يحفظ موضع التمرير لكل صفحة، فعند الرجوع (زر الرجوع/السحب للخلف)
// يعود المستخدم لنفس النقطة التي كان فيها بدل العودة لبداية الصفحة.
function useScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const positions = useRef(new Map());

  // إبقاء موضع التمرير محدَّثاً باستمرار لكل مسار
  useEffect(() => {
    const key = location.key;
    const onScroll = () => positions.current.set(key, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      onScroll();
      window.removeEventListener('scroll', onScroll);
    };
  }, [location.key]);

  // عند الرجوع (POP) نستعيد الموضع المحفوظ، وعند التنقل العادي نصعد للأعلى.
  // نعيد المحاولة عدة إطارات لأن المحتوى (والصور) قد يُحمَّل بشكل غير متزامن.
  useEffect(() => {
    const saved = positions.current.get(location.key);

    if (navigationType === 'POP' && saved != null) {
      let tries = 0;
      let raf = requestAnimationFrame(function step() {
        window.scrollTo(0, saved);
        if (++tries < 90 && Math.abs(window.scrollY - saved) > 2) {
          raf = requestAnimationFrame(step);
        }
      });
      return () => cancelAnimationFrame(raf);
    }

    window.scrollTo(0, 0);
  }, [location.key, navigationType]);

  // نتحكم في التمرير يدوياً بدل سلوك المتصفح الافتراضي
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);
}

// المكون الرئيسي الذي يلف كل صفحات الموقع العام: رأس علوي + محتوى + شريط تنقل سفلي.
export default function MainLayout() {
  useScrollRestoration();

  return (
    <div className="site-bg flex min-h-screen flex-col">
      <Header />
      {/* مسافة أعلى المحتوى تُدار عبر .site-main وتتبع ارتفاع الهيدر (متمدّد/مضغوط) */}
      <main className="site-main flex-1">
        <Outlet />
      </main>
      <BottomDock />
    </div>
  );
}
