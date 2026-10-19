/**
 * أدوات الثيم — تطبيق/حفظ/قراءة الثيم الحالي للموقع.
 * الثيمات المدعومة: 'dark' (داكن بنفسجي — الافتراضي) و 'warm' (دافئ بيج/بني).
 * يُطبَّق الثيم عبر السمة data-theme على وسم <html>، فتتبدّل كل ألوان/ظلال CSS.
 *
 * طبقتان من الثيم:
 * - ثيم الموقع الرئيسي (اختيار الأدمن): يُحفظ في الخادم محلياً تحت مفتاح 'site-theme'.
 * - ثيم المستخدم الخاص (زر الهيدر): يُحفظ محلياً فقط تحت مفتاح 'user-theme' ويتقدّم على ثيم الموقع.
 */

export const THEMES = ['dark', 'warm'];
export const DEFAULT_THEME = 'dark';

const SITE_THEME_KEY = 'site-theme';
const USER_THEME_KEY = 'user-theme';

/** يطبّق الثيم على عنصر <html> فقط دون أي حفظ محلي. */
export const applyThemeToDom = (theme) => {
  const themeToApply = THEMES.includes(theme) ? theme : DEFAULT_THEME;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', themeToApply);
  }
  return themeToApply;
};

/**
 * يطبّق الثيم الرئيسي للموقع (اختيار الأدمن) على <html> ويحفظه محلياً.
 * يُستخدم من لوحة الإدارة/الإعدادات. أي قيمة غير مدعومة تُرجَع إلى الافتراضي ('dark').
 */
export const applyTheme = (theme) => {
  const themeToApply = applyThemeToDom(theme);
  try {
    localStorage.setItem(SITE_THEME_KEY, themeToApply);
  } catch {
    // تجاهل أخطاء localStorage (مثل وضع التصفح الخاص)
  }
  return themeToApply;
};

/**
 * يقرأ ثيم الموقع الرئيسي المحفوظ محلياً، أو يعيد الافتراضي ('dark') عند غيابه.
 */
export const getSavedTheme = () => {
  try {
    return localStorage.getItem(SITE_THEME_KEY) || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

/**
 * يقرأ الثيم الخاص الذي اختاره المستخدم من زر الهيدر (أو null إن لم يختر بعد).
 */
export const getUserTheme = () => {
  try {
    const value = localStorage.getItem(USER_THEME_KEY);
    return THEMES.includes(value) ? value : null;
  } catch {
    return null;
  }
};

/**
 * يحفظ ثيم المستخدم الخاص ويطبّقه فوراً. هذا الاختيار يتقدّم على ثيم الموقع الرئيسي.
 */
export const setUserTheme = (theme) => {
  const themeToApply = THEMES.includes(theme) ? theme : DEFAULT_THEME;
  try {
    localStorage.setItem(USER_THEME_KEY, themeToApply);
  } catch {
    // تجاهل أخطاء localStorage
  }
  return applyThemeToDom(themeToApply);
};

/**
 * يقرأ الثيم الفعّال حالياً من <html> (المطبَّق فعلاً على الشاشة).
 */
export const getAppliedTheme = () => {
  if (typeof document === 'undefined') return DEFAULT_THEME;
  const current = document.documentElement.getAttribute('data-theme');
  return THEMES.includes(current) ? current : DEFAULT_THEME;
};
