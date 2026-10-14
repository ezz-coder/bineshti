import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { IconBuilding, IconLand, IconPlus, IconVilla } from '../../components/icons';
import { adminApi, getApiErrorMessage } from '../../services/api';
import { APP_NAME } from '../../utils/constants';

// بطاقة إحصاء + رابط لقسم
function SectionCard({ to, Icon, title, count }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-card border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-soft-blue text-accent">
        <Icon className="h-6 w-6" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-semibold text-dark-gray/60">{title}</span>
        <span className="block text-2xl font-extrabold text-dark-gray">{count ?? '—'}</span>
      </span>
    </Link>
  );
}

/**
 * الصفحة الرئيسية للوحة التحكم: نظرة عامة على الأقسام وعدد العقارات.
 */
export default function AdminDashboard() {
  const [counts, setCounts] = useState({ apartment: null, villa: null, land: null });
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [apt, villa, land] = await Promise.all([
          adminApi.get('/apartments?includeHidden=true'),
          adminApi.get('/villas?includeHidden=true'),
          adminApi.get('/lands?includeHidden=true'),
        ]);
        if (!active) return;
        setCounts({
          apartment: apt?.data?.data?.length ?? 0,
          villa: villa?.data?.data?.length ?? 0,
          land: land?.data?.data?.length ?? 0,
        });
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'تعذّر تحميل الإحصائيات.'));
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 rounded-2xl bg-soft-blue p-6">
        <h1 className="text-2xl font-bold text-dark-gray">مرحباً بك</h1>
        <p className="mt-2 text-sm text-dark-gray/70">{APP_NAME} — لوحة إدارة العقارات.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SectionCard to="/admin/apartments" Icon={IconBuilding} title="الشقق" count={counts.apartment} />
        <SectionCard to="/admin/villas" Icon={IconVilla} title="الفلل" count={counts.villa} />
        <SectionCard to="/admin/lands" Icon={IconLand} title="الأراضي" count={counts.land} />
      </div>

      <div className="mt-6">
        <Link
          to="/admin/apartments/new"
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95"
        >
          <IconPlus className="h-4 w-4" />
          إضافة عقار جديد
        </Link>
      </div>
    </div>
  );
}