import { IconClose } from './icons';

/**
 * نافذة تأكيد منبثقة عامة (Modal).
 * تُستخدم لتأكيد الحذف وغيره من الإجراءات النهائية.
 *
 * open: هل النافذة مفتوحة.
 * title: عنوان النافذة.
 * message: نص التحذير/التأكيد.
 * confirmLabel: نص زر التأكيد.
 * cancelLabel: نص زر الإلغاء.
 * danger: هل الزر التأكيدي أحمر (للحذف).
 * loading: حالة جاري التنفيذ (يُعطّل الأزرار).
 * onConfirm / onCancel: الدوال المنفذة.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dark-gray/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md animate-fade-in rounded-modal border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold text-dark-gray">{title}</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="إغلاق"
            className="rounded-lg p-1 text-dark-gray/50 transition-all duration-300 hover:bg-soft-blue hover:text-dark-gray"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-dark-gray/70">{message}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-start">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-button bg-soft-blue px-5 py-2.5 text-sm font-semibold text-dark-gray transition-all duration-200 hover:scale-105 hover:bg-soft-blue/70 active:scale-95 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={
              danger
                ? 'inline-flex items-center justify-center rounded-button bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-red-600 active:scale-95 disabled:opacity-60'
                : 'inline-flex items-center justify-center rounded-button bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95 disabled:opacity-60'
            }
          >
            {loading ? 'جارٍ التنفيذ…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}