import { useEffect, useState } from 'react';
import Pagination from '../components/Pagination';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PropertyCard from '../components/PropertyCard';
import PropertySkeletonDisabled from '../components/PropertySkeleton';
import { IconClose, IconSearch } from '../components/icons';
import useSettings from '../hooks/useSettings';
import api from '../services/api';

/**
 * صفحة البحث الكاملة (/search?q=الكلمة):
 * - شريط بحث ثابت في الأعلى يقرأ القيمة من URL search params.
 * - النتائج تُعرض عمودياً ببطاقات PropertyCard الموحدة (مع رقمي التواصل).
 * - الحالات: تحميل / لا توجد كلمة بحث / لا نتائج / خطأ في الاتصال.
 */
export default function SearchResults() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const query = (searchParams.get('q') || '').trim();

  const [inputValue, setInputValue] = useState(query);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { contactPhone, whatsappPhone } = useSettings();

  // مزامنة حقل الإدخال مع ?q= عند تغيّره من المتصفح (رجوع/أمام)
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // جلب النتائج عند تغيّر كلمة البحث فقط (لا يُرسل أي طلب عند الكلمة الفارغة)
  useEffect(() => {
    if (!query) {
      setResults([]);
      setError(false);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(false);

    async function load() {
      try {
        const res = await api.get('/search', { params: { q: query, page } });
        const data = res?.data?.data || {};
        // دمج الأقسام الثلاثة في قائمة واحدة مع ضمان وجود category لكل بطاقة
        const merged = [
          ...(Array.isArray(data.apartments) ? data.apartments : []).map((p) => ({
            ...p,
            category: p.category || 'apartment',
          })),
          ...(Array.isArray(data.villas) ? data.villas : []).map((p) => ({
            ...p,
            category: p.category || 'villa',
          })),
          ...(Array.isArray(data.lands) ? data.lands : []).map((p) => ({
            ...p,
            category: p.category || 'land',
          })),
        ];
        if (active) setResults(merged);
      } catch (err) {
        if (active) {
          setResults([]);
          setError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [query]);

  // تحديث الـ URL فقط — الـ useEffect أعلاه يجلب النتائج الجديدة تلقائياً
  const handleSubmit = (event) => {
    event.preventDefault();
    const next = inputValue.trim();
    if (!next) return;
    setSearchParams({ q: next });
  };

  // مسح الحقل والعودة لحالة "اكتب كلمة للبحث"
  const handleClear = () => {
    setInputValue('');
    setSearchParams({});
  };

  return (
    <section className="animate-fade-in">
      {/* ===== شريط البحث الثابت في الأعلى ===== */}
      <div className="glass-effect sticky top-36 z-10 bg-sticky-bg shadow-sm sm:top-44">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-full bg-soft-beige ring-1 ring-dark-gray/10 transition-all duration-300 focus-within:ring-accent/40">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('search.placeholder')}
                aria-label={t('search.label')}
                className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm text-dark-gray placeholder:text-dark-gray/40 focus:outline-none"
              />

              {/* زر المسح — يظهر فقط عند وجود نص */}
              {inputValue && (
                <button
                  type="button"
                  aria-label="مسح البحث"
                  onClick={handleClear}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-dark-gray/50 transition-all duration-300 hover:text-dark-gray"
                >
                  <IconClose />
                </button>
              )}
            </div>

            {/* زر البحث */}
            <button
              type="submit"
              aria-label={t('search.label')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-all duration-300 hover:scale-105 hover:bg-accent/90 active:scale-95"
            >
              <IconSearch />
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 pb-24 pt-6 sm:px-6 sm:pb-20 lg:px-8">
        {/* ===== عنوان النتائج ===== */}
        {query && (
          <div className="mb-6">
            <h1 className="text-lg font-bold text-dark-gray sm:text-xl">
              نتائج البحث عن: <span className="text-accent">{query}</span>
            </h1>
            {!loading && !error && results.length > 0 && (
              <p className="mt-1 text-sm text-dark-gray/55">
                تم العثور على {results.length} نتيجة
              </p>
            )}
          </div>
        )}

        {/* ===== أثناء التحميل ===== */}
        {loading && <PropertySkeletonDisabled count={3} />}

        {/* ===== خطأ في الاتصال ===== */}
        {!loading && error && (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-sm font-medium text-dark-gray/60">
              تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً
            </p>
          </div>
        )}

        {/* ===== لم يكتب كلمة بحث بعد ===== */}
        {!loading && !error && !query && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-soft-blue text-accent/50">
              <IconSearch className="h-10 w-10" />
            </span>
            <p className="mt-5 text-base font-bold text-dark-gray">
              اكتب كلمة للبحث في العقارات
            </p>
            <p className="mt-2 text-sm text-dark-gray/55">
              ابحث بالعنوان أو الوصف أو المنطقة للوصول إلى العقار المناسب
            </p>
          </div>
        )}

        {/* ===== لا توجد نتائج مطابقة ===== */}
        {!loading && !error && query && results.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-soft-blue text-accent/50">
              <IconSearch className="h-10 w-10" />
            </span>
            <p className="mt-5 text-base font-bold text-dark-gray">
              لا توجد نتائج مطابقة لـ {query}
            </p>
            <p className="mt-2 text-sm text-dark-gray/55">
              جرّب كلمات مختلفة أو تصفح الأقسام
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center rounded-button bg-accent px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95"
            >
              العودة للرئيسية
            </Link>
          </div>
        )}

        {/* ===== قائمة النتائج (متجاوبة) ===== */}
        {!loading && !error && query && results.length > 0 && (
          <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 lg:max-w-6xl">
            {results.map((item) => (
              <PropertyCard
                key={`${item.category}-${item.id}`}
                property={item}
                category={item.category}
                contactPhone={contactPhone}
                whatsappPhone={whatsappPhone}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

