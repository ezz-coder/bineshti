import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// زرّا التبديل: إيجار / تمليك (مع خيار اختياري "الكل").
// قابل للاستخدام بدون تحكم (حالة داخلية) كما في الـ Header،
// أو مع تحكم كامل عبر value و onChange كما في صفحات الأقسام.
// عند تمرير showAll نضيف زرّ "الكل" (key = 'all') في البداية.
const TYPES = [
  { key: 'rent', labelKey: 'type.rent' },
  { key: 'buy', labelKey: 'type.buy' },
];

const ALL_OPTION = { key: 'all', labelKey: 'type.all' };

export default function TypeToggle({ value, onChange, showAll = false }) {
  const { t } = useTranslation();
  const [internal, setInternal] = useState('rent');

  // إن لم يُمرّر value نعمل بوضع غير متحكَّم (uncontrolled) ونحتفظ بحالة داخلية.
  const isControlled = value !== undefined;
  const active = isControlled ? value : internal;

  const handleClick = (key) => {
    if (!isControlled) setInternal(key);
    if (onChange) onChange(key);
  };

  const options = showAll ? [ALL_OPTION, ...TYPES] : TYPES;

  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-dark-surface p-1 shadow-sm ring-1 ring-border-glow/40">
      {options.map((type) => {
        const isActive = active === type.key;
        return (
          <button
            key={type.key}
            type="button"
            onClick={() => handleClick(type.key)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-300 sm:px-6 ${
              isActive ? 'bg-accent text-white shadow' : 'text-dark-gray/70 hover:text-dark-gray'
            }`}
          >
            {t(type.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
