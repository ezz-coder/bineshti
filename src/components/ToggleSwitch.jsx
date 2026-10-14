/**
 * مفتاح تبديل (Toggle Switch) أنيق ومتوافق مع الشاشات اللمسية.
 * checked: الحالة الحالية.
 * onChange: دالة تُستدعى بالقيمة الجديدة (true/false).
 */
export default function ToggleSwitch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-all duration-300 disabled:opacity-50 ${
        checked ? 'bg-accent' : 'bg-dark-gray/20'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-all duration-300 ${
          checked ? '-translate-x-6' : '-translate-x-1'
        }`}
      />
    </button>
  );
}