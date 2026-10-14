/**
 * مكوّنات حقول نموذج قابلة لإعادة الاستخدام في لوحة التحكم.
 * تتشارك نمطاً بصرياً واحداً هادئاً متوافقاً مع هوية الموقع.
 */

export function TextField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  placeholder = '',
  min,
  dir,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-dark-gray">
        {label}
        {required && <span className="mr-1 text-red-500">*</span>}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        dir={dir}
        placeholder={placeholder}
        className="w-full rounded-input border border-dark-gray/10 bg-soft-beige px-4 py-2.5 text-sm text-dark-gray outline-none transition-all duration-300 focus:border-accent focus:bg-soft-blue focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

export function TextAreaField({
  label,
  name,
  value,
  onChange,
  rows = 4,
  placeholder = '',
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-dark-gray">{label}</span>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-input border border-dark-gray/10 bg-soft-beige px-4 py-2.5 text-sm leading-relaxed text-dark-gray outline-none transition-all duration-300 focus:border-accent focus:bg-soft-blue focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-dark-gray">
        {label}
        {required && <span className="mr-1 text-red-500">*</span>}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-input border border-dark-gray/10 bg-soft-beige px-4 py-2.5 text-sm text-dark-gray outline-none transition-all duration-300 focus:border-accent focus:bg-soft-blue focus:ring-2 focus:ring-accent/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
      {message}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
      {message}
    </div>
  );
}