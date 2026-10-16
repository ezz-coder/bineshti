import { useEffect, useRef, useState } from 'react';

import { ErrorBanner, SuccessBanner, TextAreaField, TextField } from '../../components/admin/FormFields';
import { IconCheck } from '../../components/icons';
import { adminApi, getApiErrorMessage } from '../../services/api';
import { resolveImageUrl } from '../../utils/constants';
import { applyTheme } from '../../utils/theme';

/**
 * Setting field with its own save button.
 * Saves this field only via separate PUT (partial update on server).
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
 * General settings page:
 * - Basic settings card (contact phone, company name): each field has its own save button.
 * - "Manage logo and about page" card (logo, about text, facebook link):
 *   Single "Save all settings" button sends FormData (text + image file if any).
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
  const [savingField, setSavingField] = useState(''); // name of field being saved
  const [savedField, setSavedField] = useState(''); // name of last saved field
  const [savingAll, setSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState('dark'); // site theme: dark | warm
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeMsg, setThemeMsg] = useState('');
  
  // Account security state
  const [security, setSecurity] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securitySaved, setSecuritySaved] = useState(false);
  const [securityError, setSecurityError] = useState('');

  useEffect(() => {
    let active = true;
    
    async function load() {
      if (active) setLoading(true);
      try {
        const res = await adminApi.get('/admin/settings');
        const data = res?.data?.data;
        if (data && active) {
          setForm({
            contactPhone: data.contactPhone || '',
            whatsappPhone: data.whatsappPhone || '',
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
          const savedTheme = data.theme || 'dark';
          setTheme(savedTheme);
          applyTheme(savedTheme);
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

  // Clean up temporary preview URLs when component unmounts
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

  // Save single field only via separate PUT (partial update on server)
  async function handleSaveField(field) {
    setSavingField(field);
    setSavedField('');
    setSavedAll(false);
    setError('');
    try {
      const res = await adminApi.put(`/admin/settings/${field}`, { [field]: form[field] });
      if (res.data.success) {
        setSavedField(field);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر حفظ هذا الحقل.'));
    } finally {
      setSavingField('');
    }
  }

  // Save all settings (logo, about text, facebook link) via FormData
  async function handleSaveAll(e) {
    e.preventDefault();
    setSavingAll(true);
    setSavedAll(false);
    setError('');
    
    const fd = new FormData();
    if (logoFile) fd.append('logo', logoFile);
    if (aboutImageFile) fd.append('aboutImage', aboutImageFile);
    
    // Add text fields
    Object.keys(form).forEach((key) => {
      if (form[key] !== undefined && form[key] !== null) {
        fd.append(key, form[key]);
      }
    });
    
    try {
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

  // Update login credentials securely
  async function handleSecurityUpdate() {
    // التحقق من اكتمال جميع الحقول
    if (!security.currentPassword || !security.newUsername || !security.newPassword || !security.confirmPassword) {
      setSecurityError('جميع الحقول مطلوبة.');
      return;
    }

    // التحقق من تطابق كلمة المرور الجديدة مع التأكيد
    if (security.newPassword !== security.confirmPassword) {
      setSecurityError('كلمة المرور الجديدة وتأكيدها غير متطابقتين.');
      return;
    }

    setSecuritySaving(true);
    setSecurityError('');
    setSecuritySaved(false);

    try {
      const res = await adminApi.put('/admin/credentials', {
        currentPassword: security.currentPassword,
        newUsername: security.newUsername,
        newPassword: security.newPassword,
      });

      if (res.data.success) {
        setSecuritySaved(true);
        // Clear fields after success
        setSecurity({
          currentPassword: '',
          newUsername: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSecuritySaved(false);
        }, 3000);
      }
    } catch (err) {
      setSecurityError(getApiErrorMessage(err, 'تعذّر تحديث بيانات الدخول.'));
    } finally {
      setSecuritySaving(false);
    }
  }

  // حفظ مظهر الموقع في الخادم
  async function handleSaveTheme(newTheme) {
    if (theme === newTheme) return;
    setThemeSaving(true);
    setThemeMsg('');
    setError('');
    try {
      const res = await adminApi.put('/admin/settings', { theme: newTheme });
      if (res.data.success) {
        setTheme(newTheme);
        applyTheme(newTheme);
        setThemeMsg('تم حفظ مظهر الموقع بنجاح.');
        setTimeout(() => setThemeMsg(''), 3000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر حفظ مظهر الموقع.'));
    } finally {
      setThemeSaving(false);
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
        <p className="mb-4 text-sm text-dark-gray/60">اختر مظهر الموقع</p>

        {themeMsg && (
          <div className="mb-4">
            <SuccessBanner message={themeMsg} />
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => handleSaveTheme('dark')}
            disabled={themeSaving || theme === 'dark'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-gray-500 active:scale-95 disabled:opacity-60"
          >
            {themeSaving && theme === 'dark' ? 'جارٍ الحفظ…' : 'داكن'}
          </button>
          <button
            type="button"
            onClick={() => handleSaveTheme('warm')}
            disabled={themeSaving || theme === 'warm'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-amber-500 active:scale-95 disabled:opacity-60"
          >
            {themeSaving && theme === 'warm' ? 'جارٍ الحفظ…' : 'دافئ'}
          </button>
        </div>
      </div>

      {/* ===== الإعدادات الأساسية ===== */}
      <div className="rounded-card border border-border bg-card p-5 shadow-card">
        <h2 className="mb-1 text-base font-bold text-dark-gray">الإعدادات الأساسية</h2>
        <p className="mb-4 text-sm text-dark-gray/60">معلومات التواصل وبيانات الشركة</p>
        
        <div className="space-y-4">
          <SettingField
            label="رقم الهاتف"
            name="contactPhone"
            value={form.contactPhone}
            onChange={handleChange}
            placeholder="أدخل رقم الهاتف"
            onSave={handleSaveField}
            saving={savingField === 'contactPhone'}
            saved={savedField === 'contactPhone'}
          />
          
          <SettingField
            label="رقم واتساب"
            name="whatsappPhone"
            value={form.whatsappPhone}
            onChange={handleChange}
            placeholder="أدخل رقم الواتساب"
            onSave={handleSaveField}
            saving={savingField === 'whatsappPhone'}
            saved={savedField === 'whatsappPhone'}
          />
          
          <SettingField
            label="اسم الشركة"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="أدخل اسم الشركة"
            onSave={handleSaveField}
            saving={savingField === 'companyName'}
            saved={savedField === 'companyName'}
          />
        </div>
      </div>

      {/* ===== إدارة الشعار وصفحة من نحن ===== */}
      <div className="rounded-card border border-border bg-card p-5 shadow-card">
        <h2 className="mb-1 text-base font-bold text-dark-gray">إدارة الشعار وصفحة من نحن</h2>
        <p className="mb-4 text-sm text-dark-gray/60">الشعار ونصوص صفحة من نحن</p>
        
        <form onSubmit={handleSaveAll}>
          <div className="space-y-6">
            {/* Logo section */}
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-dark-gray">الشعار الحالي</span>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dark-gray/10 bg-soft-beige">
                  {previewSrc ? (
                    <img src={previewSrc} alt="Current logo" className="h-full w-full object-contain" />
                  ) : (
                    <span className="px-2 text-center text-[11px] font-medium text-dark-gray/50">
                      لا يوجد شعار
                    </span>
                  )}
                </div>
                <label className="block w-full flex-1">
                  <span className="mb-1.5 block text-xs font-medium text-dark-gray/70">
                    اختر شعاراً جديداً (jpg, png, webp)
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
                      اختر الشعار
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

            {/* About text section */}
            <TextAreaField
              label="نص «من نحن»"
              name="aboutText"
              value={form.aboutText}
              onChange={handleChange}
              rows={6}
              placeholder="اكتب وصفاً احترافياً للشركة…"
            />

            <TextField
              label="عنوان صفحة «من نحن»"
              name="aboutTitle"
              value={form.aboutTitle}
              onChange={handleChange}
              placeholder="مثال: من نحن"
            />

            <TextField
              label="العنوان الفرعي لصفحة «من نحن»"
              name="aboutSubtitle"
              value={form.aboutSubtitle}
              onChange={handleChange}
              placeholder="مثال: قصتنا"
            />

            <TextAreaField
              label="عنوان القسم الأول"
              name="aboutSection1Title"
              value={form.aboutSection1Title}
              onChange={handleChange}
              rows={4}
              placeholder="مثال: رسالتنا"
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
              placeholder="مثال: رؤيتنا"
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
              <span className="mb-1.5 block text-sm font-semibold text-dark-gray">صورة إضافية لصفحة من نحن</span>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dark-gray/10 bg-soft-beige">
                  {aboutImagePreviewSrc ? (
                    <img src={aboutImagePreviewSrc} alt="About page image" className="h-full w-full object-cover" />
                  ) : (
                    <span className="px-2 text-center text-[11px] font-medium text-dark-gray/50">
                      لا توجد صورة
                    </span>
                  )}
                </div>
                <label className="block w-full flex-1">
                  <span className="mb-1.5 block text-xs font-medium text-dark-gray/70">
                    اختر صورة جديدة (jpg, png, webp)
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
                      اختر الصورة
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
                {savingAll ? 'جارٍ الحفظ…' : 'حفظ جميع إعدادات صفحة «من نحن»'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* ===== أمان الحساب ===== */}
      <div className="mb-8 rounded-card border border-border bg-card p-6 shadow-card">
        <h2 className="mb-6 text-lg font-bold text-dark-gray">أمان الحساب</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-semibold text-dark-gray mb-2">
              كلمة المرور الحالية
            </label>
            <input
              id="currentPassword"
              type="password"
              value={security.currentPassword}
              onChange={(e) => setSecurity({...security, currentPassword: e.target.value})}
              className="w-full rounded-input border border-dark-gray/10 bg-soft-beige px-4 py-3 text-sm text-dark-gray outline-none transition-all duration-300 focus:border-accent focus:bg-soft-blue focus:ring-2 focus:ring-accent/20"
              placeholder="أدخل كلمة المرور الحالية"
            />
          </div>

          <div>
            <label htmlFor="newUsername" className="block text-sm font-semibold text-dark-gray mb-2">
              اسم المستخدم الجديد
            </label>
            <input
              id="newUsername"
              type="text"
              value={security.newUsername}
              onChange={(e) => setSecurity({...security, newUsername: e.target.value})}
              className="w-full rounded-input border border-dark-gray/10 bg-soft-beige px-4 py-3 text-sm text-dark-gray outline-none transition-all duration-300 focus:border-accent focus:bg-soft-blue focus:ring-2 focus:ring-accent/20"
              placeholder="أدخل اسم المستخدم الجديد"
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-semibold text-dark-gray mb-2">
              كلمة المرور الجديدة
            </label>
            <input
              id="newPassword"
              type="password"
              value={security.newPassword}
              onChange={(e) => setSecurity({...security, newPassword: e.target.value})}
              className="w-full rounded-input border border-dark-gray/10 bg-soft-beige px-4 py-3 text-sm text-dark-gray outline-none transition-all duration-300 focus:border-accent focus:bg-soft-blue focus:ring-2 focus:ring-accent/20"
              placeholder="أدخل كلمة المرور الجديدة"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-dark-gray mb-2">
              تأكيد كلمة المرور الجديدة
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={security.confirmPassword}
              onChange={(e) => setSecurity({...security, confirmPassword: e.target.value})}
              className="w-full rounded-input border border-dark-gray/10 bg-soft-beige px-4 py-3 text-sm text-dark-gray outline-none transition-all duration-300 focus:border-accent focus:bg-soft-blue focus:ring-2 focus:ring-accent/20"
              placeholder="أعد إدخال كلمة المرور الجديدة"
            />
          </div>

          {securityError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {securityError}
            </div>
          )}

          {securitySaved && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              تم تحديث بيانات الدخول بنجاح.
            </div>
          )}

          <button
            type="button"
            onClick={handleSecurityUpdate}
            disabled={securitySaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95 disabled:opacity-60"
          >
            {securitySaving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  );
}