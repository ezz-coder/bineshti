import { Outlet } from 'react-router-dom';

import BottomDock from '../components/BottomDock';
import Header from '../components/Header';

// المكون الرئيسي الذي يلف كل صفحات الموقع العام: رأس علوي + محتوى + شريط تنقل سفلي.
export default function MainLayout() {
  return (
    <div className="site-bg flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-40 sm:pt-48">
        <Outlet />
      </main>
      <BottomDock />
    </div>
  );
}
