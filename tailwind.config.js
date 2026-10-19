/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // =========================================================
        // نظام الثيمات: كل الألوان تُقرأ من CSS Variables (src/index.css)
        // تتبدّل تلقائياً حسب data-theme على <html> (داكن / دافئ).
        // صيغة قنوات RGB (<alpha-value>) حتى تظل معاملات الشفافية
        // مثل bg-accent/10 و text-dark-gray/60 تعمل بلا انكسار.
        // =========================================================

        // ===== ألوان ثابتة بصيغة rgba/hex (تتبدّل كوحدة واحدة) =====
        'dark-bg': 'var(--c-dark-bg)',
        'dark-card': 'var(--c-dark-card)',
        'dark-header': 'var(--c-dark-header)',
        border: 'var(--c-border)',
        'border-dark': 'var(--c-border)',
        bg: 'var(--c-bg)',
        'card-bg': 'var(--c-card-bg)',
        'header-bg': 'var(--c-header-bg)',
        'dock-bg': 'var(--c-dock-bg)',
        'sticky-bg': 'var(--c-sticky-bg)',
        card: 'var(--c-card)',

        // ===== ألوان بقنوات RGB (تدعم معامل الشفافية /xx) =====
        'dark-surface': 'rgb(var(--c-dark-surface) / <alpha-value>)',
        primary: 'rgb(var(--c-primary) / <alpha-value>)',
        'primary-light': 'rgb(var(--c-primary-light) / <alpha-value>)',
        'primary-glow': 'rgb(var(--c-primary-glow) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)', // لون التأكيد للنصوص والروابط والأيقونات
        'text-primary': 'rgb(var(--c-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--c-text-secondary) / <alpha-value>)',
        'text-muted': 'rgb(var(--c-text-muted) / <alpha-value>)',
        'text-dark': 'rgb(var(--c-text-dark) / <alpha-value>)',
        'text-main': 'rgb(var(--c-text-main) / <alpha-value>)', // نص عادي
        'border-glow': 'rgb(var(--c-border-glow) / <alpha-value>)',
        'soft-blue': 'rgb(var(--c-soft-blue) / <alpha-value>)', // أسطح (حقول، رقاقات، مكان الصور)
        'soft-beige': 'rgb(var(--c-soft-beige) / <alpha-value>)', // خلفية صفحات
        'dark-gray': 'rgb(var(--c-dark-gray) / <alpha-value>)', // النص الرئيسي في المكوّنات
      },
      fontFamily: {
        arabic: ['Tajawal', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sm: 'var(--sh-sm)',
        md: 'var(--sh-md)',
        lg: 'var(--sh-lg)',
        xl: 'var(--sh-xl)',
        '2xl': 'var(--sh-2xl)',
        card: 'var(--sh-card)',
        'card-hover': 'var(--sh-card-hover)',
        button: 'var(--sh-button)',
        'button-hover': 'var(--sh-button-hover)',
        glow: 'var(--sh-glow)',
        'glow-strong': 'var(--sh-glow-strong)',
      },
      borderRadius: {
        card: '1.5rem',
        button: '1rem',
        input: '1rem',
        modal: '1.5rem',
        image: '1rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
      },
    },
  },
  plugins: [],
};
