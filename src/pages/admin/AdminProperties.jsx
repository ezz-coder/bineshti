import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import ConfirmDialog from '../../components/ConfirmDialog';
import ToggleSwitch from '../../components/ToggleSwitch';
import {
  IconBuilding,
  IconEyeOff,
  IconLand,
  IconPencil,
  IconPlus,
  IconStar,
  IconTrash,
  IconVilla,
} from '../../components/icons';
import { adminApi, getApiErrorMessage } from '../../services/api';
import { CATEGORIES, resolveImageUrl } from '../../utils/constants';

// خريطة الأيقونة والمسار لكل قسم
const CATEGORY_META = {
  apartment: { Icon: IconBuilding, adminPath: '/admin/apartments', newPath: '/admin/apartments/new' },
  villa: { Icon: IconVilla, adminPath: '/admin/villas', newPath: '/admin/villas/new' },
  land: { Icon: IconLand, adminPath: '/admin/lands', newPath: '/admin/lands/new' },
};

function hasPositiveNumber(value) {
  const n = Number(value);
  return value !== null && value !== undefined && value !== '' && !Number.isNaN(n) && n > 0;
}

// شارة حالة صغيرة
function StatusBadge({ hidden, featured }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {featured && (
        <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-300">مميز</span>
      )}
      {hidden && (
        <span className="rounded-md bg-dark-gray/10 px-2 py-0.5 text-[11px] font-bold text-dark-gray/60">مخفي</span>
      )}
    </span>
  );
}

/**
 * صفحة موحدة لإدارة عقارات قسم معيّن (شقق/فلل/أراضي).
 * تعرض جدولاً على اللابتوب وبطاقات مكدسة على الموبايل، مع:
 *   - تعديل، حذف (مع Modal تأكيد)، تبديل الإخفاء، تبديل المميز.
 */
export default function AdminProperties({ category }) {
  const navigate = useNavigate();
  const categoryInfo = CATEGORIES[category] || CATEGORIES.apartment;
  const meta = CATEGORY_META[category] || CATEGORY_META.apartment;
  const endpoint = categoryInfo.endpoint; // مسار عام (GET) — لجلب القائمة
  const adminEndpoint = categoryInfo.adminEndpoint; // مسار لوحة التحكم (PUT/DELETE) — يحتاج JWT

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // حالة المودال: العنصر المطلوب حذفه
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // مؤشر التحميل لأزرار التبديل لكل صف
  const [togglingId, setTogglingId] = useState(null);

  const canDelete = useMemo(() => Boolean(deleteTarget), [deleteTarget]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      // نطلب includeHidden=true حتى تظهر العقارات المخفية أيضاً في اللوحة
      const res = await adminApi.get(`${endpoint}?includeHidden=true`);
      setItems(Array.isArray(res?.data?.data) ? res.data.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر تحميل العقارات.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  // تبديل حالة الإخفاء فوراً دون حذف العقار
  async function toggleHidden(item) {
    setTogglingId(item.id);
    try {
      const res = await adminApi.put(`${adminEndpoint}/${item.id}/hidden`, {
        isHidden: !item.isHidden,
      });
      const updated = res?.data?.data;
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, ...updated } : it)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر تغيير حالة الإخفاء.'));
    } finally {
      setTogglingId(null);
    }
  }

  // تبديل حالة المميز فوراً
  async function toggleFeatured(item) {
    setTogglingId(item.id);
    try {
      const res = await adminApi.put(`${adminEndpoint}/${item.id}/featured`, {
        isFeatured: !item.isFeatured,
      });
      const updated = res?.data?.data;
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, ...updated } : it)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر تغيير حالة المميز.'));
    } finally {
      setTogglingId(null);
    }
  }

  // تنفيذ الحذف بعد التأكيد من المودال
  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.delete(`${adminEndpoint}/${deleteTarget.id}`);
      setItems((prev) => prev.filter((it) => it.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر حذف العقار.'));
    } finally {
      setDeleting(false);
    }
  }

  const editPath = (id) => `${meta.newPath.replace('/new', '')}/${id}/edit`;

  return (
    <div className="mx-auto max-w-5xl">
      {/* رأس الصفحة */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-xl font-bold text-dark-gray sm:text-2xl">
          <meta.Icon className="h-6 w-6 text-accent" />
          {categoryInfo.name}
        </h1>
        <Link
          to={meta.newPath}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95"
        >
          <IconPlus className="h-4 w-4" />
          <span className="hidden sm:inline">إضافة</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm font-medium text-dark-gray/60">جارٍ التحميل…</div>
      ) : items.length === 0 ? (
        <div className="rounded-card border border-border bg-card p-10 text-center shadow-card">
          <p className="text-sm font-medium text-dark-gray/60">لا توجد عقارات بعد. ابدأ بإضافة عقار جديد.</p>
        </div>
      ) : (
        <>
          {/* ===== جدول (لابتوب وأكبر) ===== */}
          <div className="hidden overflow-hidden rounded-card border border-border bg-card shadow-card md:block">
            <table className="w-full text-right text-sm">
              <thead className="border-b border-dark-gray/5 bg-soft-beige text-xs text-dark-gray/60">
                <tr>
                  <th className="px-4 py-3 font-semibold">الصورة</th>
                  <th className="px-4 py-3 font-semibold">العنوان</th>
                  <th className="px-4 py-3 font-semibold">النوع</th>
                  <th className="px-4 py-3 font-semibold">السعر</th>
                  <th className="px-4 py-3 font-semibold">مخفي</th>
                  <th className="px-4 py-3 font-semibold">مميز</th>
                  <th className="px-4 py-3 font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-gray/5">
                {items.map((item) => {
                  const firstImg = Array.isArray(item.images) ? item.images[0] : null;
                  const disabled = togglingId === item.id;
                  return (
                    <tr key={item.id} className="transition-all duration-300 hover:bg-soft-beige/50">
                      <td className="px-4 py-3">
                        <div className="h-12 w-16 overflow-hidden rounded-lg bg-soft-blue">
                          {firstImg ? (
                            <img src={resolveImageUrl(firstImg)} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-dark-gray/40">لا صورة</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block max-w-[200px] truncate font-semibold text-dark-gray">{item.mainTitle}</span>
                        <StatusBadge hidden={item.isHidden} featured={item.isFeatured} />
                      </td>
                      <td className="px-4 py-3 text-dark-gray/70">{item.type}</td>
                      <td className="px-4 py-3 font-semibold text-accent">
                        {hasPositiveNumber(item.price) ? Number(item.price).toLocaleString('ar-EG') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <ToggleSwitch checked={item.isHidden} disabled={disabled} onChange={() => toggleHidden(item)} label="إخفاء" />
                      </td>
                      <td className="px-4 py-3">
                        <ToggleSwitch checked={item.isFeatured} disabled={disabled} onChange={() => toggleFeatured(item)} label="مميز" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={editPath(item.id)}
                            aria-label="تعديل"
                            className="rounded-lg bg-soft-blue p-2 text-accent transition-all duration-300 hover:bg-accent hover:text-white"
                          >
                            <IconPencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            aria-label="حذف"
                            className="rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-red-400 transition-all duration-300 hover:bg-red-500 hover:text-white"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ===== بطاقات مكدسة (موبايل) ===== */}
          <div className="space-y-3 md:hidden">
            {items.map((item) => {
              const firstImg = Array.isArray(item.images) ? item.images[0] : null;
              const disabled = togglingId === item.id;
              return (
                <div key={item.id} className="rounded-card border border-border bg-card p-4 shadow-card">
                  <div className="flex gap-3">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-soft-blue">
                      {firstImg ? (
                        <img src={resolveImageUrl(firstImg)} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-dark-gray/40">لا صورة</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-dark-gray">{item.mainTitle}</p>
                      <p className="mt-0.5 text-xs text-dark-gray/55">{item.type}</p>
                      <p className="mt-1 font-bold text-accent">
                        {hasPositiveNumber(item.price) ? `${Number(item.price).toLocaleString('ar-EG')} ج.م` : '—'}
                      </p>
                      <div className="mt-1">
                        <StatusBadge hidden={item.isHidden} featured={item.isFeatured} />
                      </div>
                    </div>
                  </div>

                  {/* أزرار التحكم بالإصبع */}
                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-dark-gray/5 pt-3">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <IconEyeOff className={`h-4 w-4 ${item.isHidden ? 'text-accent' : 'text-dark-gray/30'}`} />
                        <ToggleSwitch checked={item.isHidden} disabled={disabled} onChange={() => toggleHidden(item)} label="إخفاء" />
                      </label>
                      <label className="flex items-center gap-2">
                        <IconStar className={`h-4 w-4 ${item.isFeatured ? 'text-amber-500' : 'text-dark-gray/30'}`} />
                        <ToggleSwitch checked={item.isFeatured} disabled={disabled} onChange={() => toggleFeatured(item)} label="مميز" />
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={editPath(item.id)}
                        aria-label="تعديل"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-soft-blue px-3 py-2 text-sm font-semibold text-accent transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <IconPencil className="h-4 w-4" />
                        تعديل
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        aria-label="حذف"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-500 transition-all duration-200 hover:scale-105 active:scale-95"
                      >
                        <IconTrash className="h-4 w-4" />
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ===== نافذة تأكيد الحذف ===== */}
      <ConfirmDialog
        open={canDelete}
        title="تأكيد الحذف"
        message={
          deleteTarget
            ? `هل تريد الحذف فعلاً؟ هذا الإجراء نهائي. سيتم حذف «${deleteTarget.mainTitle}» نهائياً مع صوره.`
            : ''
        }
        confirmLabel="نعم، احذف"
        cancelLabel="إلغاء"
        danger
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}