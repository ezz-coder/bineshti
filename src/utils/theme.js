/**
 * أدوات الثيم — تطبيق/حفظ/قراءة الثيم الحالي للموقع.
 * الثيمات المدعومة: 'dark' (داكن بنفسجي — الافتراضي) و 'warm' (دافئ بيج/بني).
 * يُطبَّق الثيم عبر السمة data-theme على وسم <html>، فتتبدّل كل ألوان/ظلال CSS.
 */

export const THEMES = ['dark', 'warm'];
export const DEFAULT_THEME = 'dark';

/**
 * يطبّق الثيم على عنصر <html> ويحفظه في localStorage.
 * أي قيمة غير مدعومة تُرجَع إلى الافتراضي ('dark').
 */
export const applyTheme = (theme) => {
  const themeToApply = THEMES.includes(theme) ? theme : DEFAULT_THEME;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', themeToApply);
  }
  try {
    localStorage.setItem('site-theme', themeToApply);
  } catch {
    // تجاهل أخطاء localStorage (مثل وضع التصفح الخاص)
  }
  return themeToApply;
};

/**
 * يقرأ الثيم المحفوظ محلياً، أو يعيد الافتراضي ('dark') عند غيابه.
 */
export const getSavedTheme = () => {
  try {
    return localStorage.getItem('site-theme') || DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};
