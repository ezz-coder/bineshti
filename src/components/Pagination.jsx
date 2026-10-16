// مكوّن تصفح الصفحات (Pagination)
// يعرض أرقام الصفحات (1, 2, 3, ..., آخر صفحة) مع أزرار "السابق" و "التالي"
// تصميم أنيق يتناسب مع الثيمين (يستخدم btn-secondary للأزرار)

import { useMemo } from 'react';

/**
 * مكوّن pagination بسيط وعصري
 * @param {Object} props
 * @param {number} props.currentPage - الصفحة الحالية
 * @param {number} props.totalPages - إجمالي الصفحات
 * @param {function} props.onPageChange - دالة عند تغيير الصفحة
 * @param {string} props.prevLabel - تسمية زر "السابق" (اختياري)
 * @param {string} props.nextLabel - تسمية زر "التالي" (اختياري)
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  prevLabel = 'سابق',
  nextLabel = 'التالي',
}) {
  // حساب أرقام الصفحات المعروضة (نعرض الآن + 1 على اليمين واليسار)
  const pageNumbers = useMemo(() => {
    const maxVisible = 5; // العدد الأقصى للصفحات المعروضة في كل جانب
    const pages = [];

    if (totalPages <= maxVisible * 2 + 1) {
      // إذا كان العدد الإجمالي للصفحات صغيراً، نعرض كلها
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // نعرض دائم الصفحة الأولى
      pages.push(1);

      // حساب النطاق
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // إذا كانت الصفحة الحالية قريبة منが始め
      if (currentPage <= 2) {
        end = Math.min(maxVisible, totalPages - 1);
      }

      // إذا كانت الصفحة الحالية قريبة من النهاية
      if (currentPage >= totalPages - 1) {
        start = Math.max(totalPages - maxVisible, 2);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // نعرض دائما الصفحة الأخيرة
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  const goToPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // disabled للأزرار عند الحدود
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  if (totalPages <= 1) return null; // لا نعرض pagination إذا لم يكن هناك more من صفحة

  return (
    <nav className="mt-10 flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* زر السابق */}
        <button
          onClick={goToPrevious}
          disabled={prevDisabled}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
            prevDisabled
              ? 'bg-soft-blue/40 text-soft-blue cursor-not-allowed'
              : 'bg-soft-blue text-accent hover:bg-soft-blue/80 hover:scale-[1.02] shadow-card'
          }`}
          aria-label="الصفحة السابقة"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          {prevLabel}
        </button>

        {/* أرقام الصفحات */}
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={page === currentPage}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
              page === currentPage
                ? 'bg-accent text-white shadow-card'
                : 'bg-soft-blue text-accent hover:bg-soft-blue/80 hover:scale-[1.02]'
            }`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </button>
        ))}

        {/* زر التالي */}
        <button
          onClick={goToNext}
          disabled={nextDisabled}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 ${
            nextDisabled
              ? 'bg-soft-blue/40 text-soft-blue cursor-not-allowed'
              : 'bg-soft-blue text-accent hover:bg-soft-blue/80 hover:scale-[1.02] shadow-card'
          }`}
          aria-label="الصفحة التالية"
        >
          {nextLabel}
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* إجمالي العقارات والصفحات */}
      <p className="text-sm text-muted">
        عرض {Math.min(currentPage * 12, 0) + 12} إلى{' '}
        {Math.min(currentPage * 12, 0) + 12} عقاراً من إجمالي {totalPages} صفحة
      </p>
    </nav>
  );
}