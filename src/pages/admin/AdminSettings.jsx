import { useEffect, useRef, useState } from 'react';

import { ErrorBanner, SuccessBanner, TextAreaField, TextField } from '../../components/admin/FormFields';
import { IconCheck } from '../../components/icons';
import { adminApi, getApiErrorMessage } from '../../services/api';
import { resolveImageUrl } from '../../utils/constants';
import { applyTheme } from '../../utils/theme';

/**
 * خانة إعداد واحدة مع زر حفظ خاص بها.
 * تحفظ هذا الحقل فقط عبر PUT منفصل (تحديث جزئي على الخادم).
 */
function SettingField({ label, name, value, onChange, placeholder, multiline, rows, type, dir, onSave, saving, saved }) {
  const Field = multiline ? TextAreaField : TextField;
  const extraProps = multiline ? { rows } : { type, dir };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex-1">
        <Field
          label={label}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          {...extraProps}
        />
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:mt-6">
        {saved && (
          <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
            <IconCheck className="h-4 w-4" />
            تم الحفظ
          </span>
        )}
        <button
          type="button"
          onClick={() => onSave(name)}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95 disabled:opacity-60"
        >
          {saving ? 'جارٍ الحفظ…' : 'حفظ'}
        </button>
      </div>
    </div>
  );
}

/**
 * صفحة الإعدادات العامة:
 * - بطاقة الإعدادات الأساسية (رقم التواصل، اسم الشركة): كل خانة بزر حفظ خاص.
 * - بطاقة "إدارة الشعار وصفحة من نحن" (الشعار، النبذة، رابط فيسبوك):
 *   زر واحد "حفظ جميع الإعدادات" يرسل FormData (نصوص + ملف الصورة إن وُجد).
 */
export default function AdminSettings() {
  const [form, setForm] = useState({
    contactPhone: '',
    whatsappPhone: '',
    companyName: '',
    aboutText: '',
    facebookUrl: '',
    aboutTitle: '',
    aboutSubtitle: '',
    aboutSection1Title: '',
    aboutSection1Content: '',
    aboutSection2Title: '',
    aboutSection2Content: '',
    aboutSection3Title: '',
    aboutSection3Content: '',
  });
  const [currentLogo, setCurrentLogo] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [currentAboutImage, setCurrentAboutImage] = useState('');
  const [aboutImageFile, setAboutImageFile] = useState(null);
  const [aboutImagePreview, setAboutImagePreview] = useState('');
  const fileInputRef = useRef(null);
  const aboutImageInputRef = useRef(null);
  const logoPreviewRef = useRef('');
  const aboutImagePreviewRef = useRef('');
  const [loading, setLoading] = useState(true);
  const [savingField, setSavingField] = useState(''); // اسم الحقل الجاري حفظه
  const [savedField, setSavedField] = useState(''); // اسم آخر حقل تم حفظه
  const [savingAll, setSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState('dark'); // ثيم الموقع: dark | warm
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMsg, setThemeMsg] = useState('');

  // تبديل ثيم الموقع: يحفظ في الخادم ثم يطبّقه فوراً على <html> بدون إعادة تحميل
  async function handleThemeChange(next) {
    if (next === theme || themeSaving) return;
    setThemeSaving(true);
    setThemeMsg('');
    setError('');
    try {
      await adminApi.put('/admin/settings', { theme: next });
      applyTheme(next);
      setTheme(next);
      setThemeMsg('تم تغيير الثيم بنجاح');
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر تغيير الثيم.'));
    } finally {
      setThemeSaving(false);
    }
  }

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await adminApi.get('/settings');
        const data = res?.data?.data;
        if (active && data) {
          setForm({
            contactPhone: data.contactPhone || '',
            companyName: data.companyName || '',
            aboutText: data.aboutText || '',
            facebookUrl: data.facebookUrl || '',
            aboutTitle: data.aboutTitle || '',
            aboutSubtitle: data.aboutSubtitle || '',
            aboutSection1Title: data.aboutSection1Title || '',
            aboutSection1Content: data.aboutSection1Content || '',
            aboutSection2Title: data.aboutSection2Title || '',
            aboutSection2Content: data.aboutSection2Content || '',
            aboutSection3Title: data.aboutSection3Title || '',
            aboutSection3Content: data.aboutSection3Content || '',
          });
          setCurrentLogo(data.logoUrl || '');
          setCurrentAboutImage(data.aboutImageUrl || '');
          if (data.theme === 'warm' || data.theme === 'dark') {
            setTheme(data.theme);
            applyTheme(data.theme);
          }
        }
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'تعذّر تحميل الإعدادات.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  // تنظيف روابط المعاينة المؤقتة عند إزالة المكوّن
  useEffect(() => {
    return () => {
      if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
      if (aboutImagePreviewRef.current) URL.revokeObjectURL(aboutImagePreviewRef.current);
    };
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    setSavedAll(false);
    if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    const nextPreview = file ? URL.createObjectURL(file) : '';
    logoPreviewRef.current = nextPreview;
    setLogoPreview(nextPreview);
  }

  function handleAboutImageChange(e) {
    const file = e.target.files?.[0] || null;
    setAboutImageFile(file);
    setSavedAll(false);
    if (aboutImagePreviewRef.current) URL.revokeObjectURL(aboutImagePreviewRef.current);
    const nextPreview = file ? URL.createObjectURL(file) : '';
    aboutImagePreviewRef.current = nextPreview;
    setAboutImagePreview(nextPreview);
  }

  // حفظ حقل واحد فقط عبر PUT منفصل (تحديث جزئي على الخادم)
  async function handleSaveField(field) {
    setSavingField(field);
    setSavedField('');
    setSavedAll(false);
    setError('');
    try {
      await adminApi.put('/admin/settings', { [field]: form[field] });
      setSavedField(field);
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر حفظ الإعدادات.'));
    } finally {
      setSavingField('');
    }
  }

  // حفظ قسم "الشعار وصفحة من نحن" كاملاً عبر FormData (نصوص + ملفي الصور إن وُجدا)
  async function handleSaveBranding(e) {
    e.preventDefault();
    setSavingAll(true);
    setSavedAll(false);
    setSavedField('');
    setError('');
    try {
      const fd = new FormData();
      fd.append('aboutText', form.aboutText);
      fd.append('facebookUrl', form.facebookUrl);
      fd.append('aboutTitle', form.aboutTitle);
      fd.append('aboutSubtitle', form.aboutSubtitle);
      fd.append('aboutSection1Title', form.aboutSection1Title);
      fd.append('aboutSection1Content', form.aboutSection1Content);
      fd.append('aboutSection2Title', form.aboutSection2Title);
      fd.append('aboutSection2Content', form.aboutSection2Content);
      fd.append('aboutSection3Title', form.aboutSection3Title);
      fd.append('aboutSection3Content', form.aboutSection3Content);
      if (logoFile) fd.append('logo', logoFile);
      if (aboutImageFile) fd.append('aboutImage', aboutImageFile);
      const res = await adminApi.put('/admin/settings', fd);
      const data = res?.data?.data;
      if (data) {
        setForm((prev) => ({
          ...prev,
          aboutText: data.aboutText ?? prev.aboutText,
          facebookUrl: data.facebookUrl ?? prev.facebookUrl,
          aboutTitle: data.aboutTitle ?? prev.aboutTitle,
          aboutSubtitle: data.aboutSubtitle ?? prev.aboutSubtitle,
          aboutSection1Title: data.aboutSection1Title ?? prev.aboutSection1Title,
          aboutSection1Content: data.aboutSection1Content ?? prev.aboutSection1Content,
          aboutSection2Title: data.aboutSection2Title ?? prev.aboutSection2Title,
          aboutSection2Content: data.aboutSection2Content ?? prev.aboutSection2Content,
          aboutSection3Title: data.aboutSection3Title ?? prev.aboutSection3Title,
          aboutSection3Content: data.aboutSection3Content ?? prev.aboutSection3Content,
        }));
        setCurrentLogo(data.logoUrl || '');
        setCurrentAboutImage(data.aboutImageUrl || '');
      }
      setLogoFile(null);
      setAboutImageFile(null);
      if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
      if (aboutImagePreviewRef.current) URL.revokeObjectURL(aboutImagePreviewRef.current);
      logoPreviewRef.current = '';
      aboutImagePreviewRef.current = '';
      setLogoPreview('');
      setAboutImagePreview('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (aboutImageInputRef.current) aboutImageInputRef.current.value = '';
      setSavedAll(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر حفظ إعدادات الشعار وصفحة من نحن.'));
    } finally {
      setSavingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-dark-gray/60">
        جارٍ التحميل…
      </div>
    );
  }

  const previewSrc = logoPreview || (currentLogo ? resolveImageUrl(currentLogo) : '');
  const aboutImagePreviewSrc =
    aboutImagePreview || (currentAboutImage ? resolveImageUrl(currentAboutImage) : '');

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-xl font-bold text-dark-gray sm:text-2xl">الإعدادات العامة</h1>

      {error && <ErrorBanner message={error} />}

      {/* ===== مظهر الموقع (اختيار الثيم) ===== */}
      <div className="rounded-card border border-border bg-card p-5 shadow-card">
        <h2 className="mb-1 text-base font-bold text-dark-gray">مظهر الموقع</h2>
        <p className="mb-4 text-sm text-dark-gray/60">اختر ثيم الموقع</p>

        {themeMsg && (
          <div className="mb-4">
            <SuccessBanner message={themeMsg} />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* زر الثيم الداكن */}
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            disabled={themeSaving}
            className={`flex flex-1 items-center gap-4 rounded-card border-2 p-4 text-right transition-all duration-200 disabled:opacity-60 ${
              theme === 'dark'
                ? 'border-accent bg-accent/5'
                : 'border-border bg-card hover:border-dark-gray/20'
            }`}
          >
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="h-6 w-6 rounded-full bg-[#7C3AED]" />
              <span className="h-6 w-6 rounded-full bg-[#0F0F1A]" />
              <span className="h-6 w-6 rounded-full bg-[#FFFFFF]" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-bold text-dark-gray">عصري داكن</span>
              <span className="text-xs text-dark-gray/60">بنفسجي مضيء مع زجاجية</span>
            </span>
          </button>

          {/* زر الثيم الدافئ */}
          <button
            type="button"
            onClick={() => handleThemeChange('warm')}
            disabled={themeSaving}
            className={`flex flex-1 items-center gap-4 rounded-card border-2 p-4 text-right transition-all duration-200 disabled:opacity-60 ${
              theme === 'warm'
                ? 'border-accent bg-accent/5'
                : 'border-border bg-card hover:border-dark-gray/20'
            }`}
          >
            <span className="flex shrink-0 items-center gap-1.5">
              <span className="h-6 w-6 rounded-full bg-[#8B7355]" />
              <span className="h-6 w-6 rounded-full bg-[#EDE3D5]" />
              <span className="h-6 w-6 rounded-full bg-[#FFFCE5]" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-bold text-dark-gray">كلاسيكي دافئ</span>
              <span className="text-xs text-dark-gray/60">بيج + بني + ذهبي</span>
            </span>
          </button>
        </div>
      </div>


      {/* ===== الإعدادات الأساسية ===== */}
      <div className="space-y-6 rounded-card border border-border bg-card p-5 shadow-card">
        <SettingField
          label="رقم الاتصال (يتصل مباشرة)"
          name="contactPhone"
          value={form.contactPhone}
          onChange={handleChange}
          placeholder="مثال: 01000000000"
          onSave={handleSaveField}
          saving={savingField === 'contactPhone'}
          saved={savedField === 'contactPhone'}
        />

        <div className="border-t border-dark-gray/5" />

        <SettingField
          label="رقم الواتساب (يتواصل عبر واتساب)"
          name="whatsappPhone"
          value={form.whatsappPhone || ''}
          onChange={handleChange}
          placeholder="مثال: +201000000000"
          onSave={handleSaveField}
          saving={savingField === 'whatsappPhone'}
          saved={savedField === 'whatsappPhone'}
        />

        <div className="border-t border-dark-gray/5" />

        <SettingField
          label="اسم الشركة"
          name="companyName"
          value={form.companyName}
          onChange={handleChange}
          placeholder="بي نيشتي للاستثمار العقاري"
          onSave={handleSaveField}
          saving={savingField === 'companyName'}
          saved={savedField === 'companyName'}
        />
      </div>

      {/* ===== إدارة الشعار وصفحة من نحن ===== */}
      <form
        onSubmit={handleSaveBranding}
        className="space-y-6 rounded-card border border-border bg-card p-5 shadow-card"
      >
        <div>
          <h2 className="text-base font-bold text-dark-gray sm:text-lg">
            إدارة الشعار وصفحة من نحن
          </h2>
          <p className="mt-1 text-xs font-medium text-dark-gray/60">
            الشعار يظهر في رأس الموقع وصفحة من نحن، والنبذة ورابط فيسبوك يظهران في صفحة من نحن.
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-dark-gray">الشعار الحالي</span>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dark-gray/10 bg-soft-beige">
              {previewSrc ? (
                <img src={previewSrc} alt="الشعار الحالي" className="h-full w-full object-contain" />
              ) : (
                <span className="px-2 text-center text-[11px] font-medium text-dark-gray/50">
                  لا يوجد شعار
                </span>
              )}
            </div>
            <label className="block w-full flex-1">
              <span className="mb-1.5 block text-xs font-medium text-dark-gray/70">
                اختيار صورة جديدة (jpg, png, webp)
              </span>
              <span className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                  }}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95"
                >
                  اختيار صورة
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-dark-gray/60">
                  {logoFile ? logoFile.name : 'لم يتم اختيار ملف'}
                </span>
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="border-t border-dark-gray/5" />

        <TextAreaField
          label="نبذة من نحن"
          name="aboutText"
          value={form.aboutText}
          onChange={handleChange}
          rows={6}
          placeholder="اكتب نبذة احترافية عن الشركة…"
        />

        <div className="border-t border-dark-gray/5" />

        <TextField
          label="رابط صفحة فيسبوك"
          name="facebookUrl"
          type="url"
          dir="ltr"
          value={form.facebookUrl}
          onChange={handleChange}
          placeholder="https://facebook.com/..."
        />

        <div className="border-t border-dark-gray/5" />

        <div>
          <h3 className="text-sm font-bold text-dark-gray">
            نصوص صفحة من نحن
          </h3>
          <p className="mt-1 text-xs font-medium text-dark-gray/60">
            كل حقل فارغ لن يظهر في صفحة من نحن.
          </p>
        </div>

        <TextField
          label="عنوان صفحة من نحن"
          name="aboutTitle"
          value={form.aboutTitle}
          onChange={handleChange}
          placeholder="مثال: من نحن"
        />

        <TextField
          label="العنوان الفرعي"
          name="aboutSubtitle"
          value={form.aboutSubtitle}
          onChange={handleChange}
          placeholder="مثال: تعرف علينا أكثر"
        />

        <TextField
          label="عنوان القسم الأول"
          name="aboutSection1Title"
          value={form.aboutSection1Title}
          onChange={handleChange}
          placeholder="مثال: رؤيتنا"
        />

        <TextAreaField
          label="محتوى القسم الأول"
          name="aboutSection1Content"
          value={form.aboutSection1Content}
          onChange={handleChange}
          rows={4}
          placeholder="اكتب محتوى القسم الأول…"
        />

        <TextField
          label="عنوان القسم الثاني"
          name="aboutSection2Title"
          value={form.aboutSection2Title}
          onChange={handleChange}
          placeholder="مثال: رسالتنا"
        />

        <TextAreaField
          label="محتوى القسم الثاني"
          name="aboutSection2Content"
          value={form.aboutSection2Content}
          onChange={handleChange}
          rows={4}
          placeholder="اكتب محتوى القسم الثاني…"
        />

        <TextField
          label="عنوان القسم الثالث"
          name="aboutSection3Title"
          value={form.aboutSection3Title}
          onChange={handleChange}
          placeholder="مثال: قيمنا"
        />

        <TextAreaField
          label="محتوى القسم الثالث"
          name="aboutSection3Content"
          value={form.aboutSection3Content}
          onChange={handleChange}
          rows={4}
          placeholder="اكتب محتوى القسم الثالث…"
        />

        <div className="border-t border-dark-gray/5" />

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-dark-gray">الصورة الإضافية لصفحة من نحن</span>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dark-gray/10 bg-soft-beige">
              {aboutImagePreviewSrc ? (
                <img src={aboutImagePreviewSrc} alt="صورة صفحة من نحن" className="h-full w-full object-cover" />
              ) : (
                <span className="px-2 text-center text-[11px] font-medium text-dark-gray/50">
                  لا توجد صورة
                </span>
              )}
            </div>
            <label className="block w-full flex-1">
              <span className="mb-1.5 block text-xs font-medium text-dark-gray/70">
                اختيار صورة جديدة (jpg, png, webp)
              </span>
              <span className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => aboutImageInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') aboutImageInputRef.current?.click();
                  }}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95"
                >
                  اختيار صورة
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-dark-gray/60">
                  {aboutImageFile ? aboutImageFile.name : 'لم يتم اختيار ملف'}
                </span>
              </span>
              <input
                ref={aboutImageInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleAboutImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {savedAll && <SuccessBanner message="تم حفظ جميع الإعدادات بنجاح." />}

        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={savingAll}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95 disabled:opacity-60"
          >
            {savingAll ? 'جارٍ الحفظ…' : 'حفظ جميع إعدادات صفحة من نحن'}
          </button>
        </div>
      </form>
    </div>
  );
}
