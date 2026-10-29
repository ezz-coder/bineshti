import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ErrorBanner, SelectField, SuccessBanner, TextAreaField, TextField } from '../../components/admin/FormFields';
import ToggleSwitch from '../../components/ToggleSwitch';
import { IconArrowLeft, IconCamera, IconClose, IconPlus } from '../../components/icons';
import { adminApi, getApiErrorMessage } from '../../services/api';
import { CATEGORIES, resolveImageUrl } from '../../utils/constants';

// أنواع العقار المسموحة (تطابق قيم الـ backend)
const TYPE_OPTIONS = [
  { value: 'إيجار', label: 'إيجار' },
  { value: 'تمليك', label: 'تمليك' },
];

/**
 * نموذج ذكي موحد للإضافة/التعديل حسب نوع العقار.
 * يدير الصور بثلاث حالات منفصلة:
 *   - existingImages: روابط الصور القديمة التي يبقيها المستخدم.
 *   - imagesToDelete: روابط الصور التي حذفها المستخدم (تُرسل للـ backend).
 *   - newImages: ملفات File جديدة اختارها المستخدم.
 */
export default function PropertyForm({ category }) {
  const navigate = useNavigate();
  const params = useParams();
  const editingId = params.id || null;
  const isEdit = Boolean(editingId);

  const categoryInfo = CATEGORIES[category] || CATEGORIES.apartment;
  const endpoint = categoryInfo.endpoint; // مسار عام (GET) — لجلب العقار عند التعديل
  const adminEndpoint = categoryInfo.adminEndpoint; // مسار لوحة التحكم (POST/PUT) — يحتاج JWT

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // الحقول المشتركة + الحقول الخاصة بكل نوع
  const emptyForm = {
    type: 'تمليك',
    mainTitle: '',
    detailedAddress: '',
    description: '',
    price: '',
    floors: '',
    area: '',
    rooms: '',
    isFeatured: false,
    isHidden: false,
  };
  const [form, setForm] = useState(emptyForm);

  // ===== حالة الصور (منطق ذكي يفصل بين القديم والجديد والمحذوف) =====
  const [existingImages, setExistingImages] = useState([]); // روابط الصور المتبقية
  const [imagesToDelete, setImagesToDelete] = useState([]); // روابط محذوفة يدوياً
  const [newImages, setNewImages] = useState([]); // File[] مع معرّف محلي للمعاينة
  const [previewUrls, setPreviewUrls] = useState({}); // روابط معاينة مؤقتة للصور الجديدة (key => objectURL)

  // ===== حالة روابط الفيديو (رابط مباشر أو يوتيوب) =====
  const [videoUrls, setVideoUrls] = useState([]);

  const fileInputRef = useRef(null);

  // جلب بيانات العقار عند التعديل (بدون حذف أي صورة تلقائياً)
  useEffect(() => {
    console.log('[PropertyForm] mounted →', { category, isEdit, editingId, endpoint });
    if (!isEdit) {
      console.log('[PropertyForm] وضع الإضافة (بدون ID) — لن يتم جلب بيانات.');
      return undefined;
    }
    let active = true;
    async function load() {
      setLoading(true);
      try {
        console.log('[PropertyForm] جلب بيانات العقار للتعديل:', `${endpoint}/${editingId}`);
        const res = await adminApi.get(`${endpoint}/${editingId}`);
        const data = res?.data?.data;
        if (!active) return;
        if (data) {
          console.log('[PropertyForm] تم تحميل بيانات العقار، عدد الصور:', Array.isArray(data.images) ? data.images.length : 0);
          setForm({
            type: data.type || 'تمليك',
            mainTitle: data.mainTitle || '',
            detailedAddress: data.detailedAddress || '',
            description: data.description || '',
            price: data.price != null ? String(data.price) : '',
            floors: data.floors != null ? String(data.floors) : '',
            area: data.area != null ? String(data.area) : '',
            rooms: data.rooms != null ? String(data.rooms) : '',
            isFeatured: Boolean(data.isFeatured),
            isHidden: Boolean(data.isHidden),
          });
          // نملأ existingImages بكل الصور الحالية — لا نحذف شيئاً تلقائياً.
          setExistingImages(Array.isArray(data.images) ? data.images : []);
          // روابط الفيديو الحالية (إن وُجدت)
          setVideoUrls(Array.isArray(data.videos) ? data.videos : []);
        }
      } catch (err) {
        if (active) setError(getApiErrorMessage(err, 'تعذّر تحميل بيانات العقار.'));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [editingId, endpoint, isEdit]);

  // تنظيف كل روابط المعاينة عند إلغاء تركيب المكوّن فقط (عبر ref لتفادي إبطال الروابط المعروضة).
  const previewUrlsRef = useRef({});
  previewUrlsRef.current = previewUrls;
  useEffect(
    () => () => {
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // ===== التعامل مع الصور =====

  // حذف صورة قديمة: ننقلها من existingImages إلى imagesToDelete (بدون حذف فوري من الخادم)
  function removeExistingImage(path) {
    setExistingImages((prev) => prev.filter((p) => p !== path));
    setImagesToDelete((prev) => (prev.includes(path) ? prev : [...prev, path]));
  }

  // إضافة صور جديدة: نقبل متعدد ونحفظ File مع معرّف فريد
  function handleFilesChange(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const added = files.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
    }));

    setNewImages((prev) => [...prev, ...added]);

    setPreviewUrls((prev) => {
      const next = { ...prev };
      added.forEach(({ id, file }) => {
        next[id] = URL.createObjectURL(file);
      });
      return next;
    });

    // تصفير قيمة الحقل للسماح باختيار نفس الملف لاحقاً
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // حذف صورة جديدة قبل الإرسال
  function removeNewImage(id) {
    setNewImages((prev) => prev.filter((item) => item.id !== id));
    setPreviewUrls((prev) => {
      const next = { ...prev };
      if (next[id]) {
        URL.revokeObjectURL(next[id]);
        delete next[id];
      }
      return next;
    });
  }

  // ===== التعامل مع روابط الفيديو =====

  // إضافة حقل رابط جديد (فارغ) أسفل القائمة
  function addVideoField() {
    setVideoUrls((prev) => [...prev, '']);
  }

  // تحديث قيمة رابط في موضعه
  function updateVideoField(index, value) {
    setVideoUrls((prev) => prev.map((url, i) => (i === index ? value : url)));
  }

  // حذف حقل رابط
  function removeVideoField(index) {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  }

  // ===== الإرسال: بناء FormData بالحقول النصية + الصور =====
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append('type', form.type);
      fd.append('mainTitle', form.mainTitle);
      fd.append('detailedAddress', form.detailedAddress);
      fd.append('description', form.description);
      fd.append('price', form.price);
      fd.append('isFeatured', String(form.isFeatured));
      fd.append('isHidden', String(form.isHidden));

      // حقول خاصة بالنوع (تُرسل فقط إن كانت ذات صلة وغير فارغة)
      if (category === 'apartment' && form.floors !== '') fd.append('floors', form.floors);
      if ((category === 'villa' || category === 'house' || category === 'land') && form.area !== '') fd.append('area', form.area);
      if ((category === 'villa' || category === 'house') && form.rooms !== '') fd.append('rooms', form.rooms);

      // الصور القديمة التي أبقيها المستخدم (تُعيد بناء قائمة الصور في الخادم)
      fd.append('existingImages', JSON.stringify(existingImages));
      // الصور التي حذفها المستخدم (يعرف الخادم أيها يحذف من القرص)
      fd.append('imagesToDelete', JSON.stringify(imagesToDelete));
      // ملفات الصور الجديدة
      newImages.forEach((item) => fd.append('images', item.file));

      // روابط الفيديو (تُرسل كسلسلة JSON، مع تجاهل الفراغات)
      fd.append('videos', JSON.stringify(videoUrls.map((v) => v.trim()).filter((v) => v !== '')));

      const url = isEdit ? `${adminEndpoint}/${editingId}` : adminEndpoint;
      console.log('[PropertyForm] إرسال النموذج:', {
        method: isEdit ? 'PUT' : 'POST',
        url,
        existingImages: existingImages.length,
        imagesToDelete: imagesToDelete.length,
        newImages: newImages.length,
      });
      const res = await adminApi.request({
        method: isEdit ? 'put' : 'post',
        url,
        data: fd,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('[PropertyForm] تم الحفظ بنجاح:', res?.data?.message);
      setSuccess(res?.data?.message || 'تم الحفظ بنجاح.');
      // إعادة تعيين الصور المحذوفة (تم تطبيقها بنجاح على الخادم)
      setImagesToDelete([]);

      if (!isEdit) {
        // بعد الإضافة نعود لقائمة القسم
        setTimeout(() => navigate(categoryInfo.adminEndpoint, { replace: true }), 700);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'تعذّر حفظ العقار. تأكد من صحة البيانات.'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-dark-gray/60">
        جارٍ التحميل…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5" noValidate>
      {/* رأس النموذج */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-xl p-2 text-dark-gray/60 transition-all duration-300 hover:bg-soft-blue hover:text-dark-gray"
          aria-label="رجوع"
        >
          <IconArrowLeft className="h-5 w-5 rotate-180" />
        </button>
        <h1 className="text-xl font-bold text-dark-gray sm:text-2xl">
          {isEdit ? 'تعديل' : 'إضافة'} {categoryInfo.name}
        </h1>
      </div>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      {/* الحقول المشتركة */}
      <div className="space-y-4 rounded-card border border-border bg-card p-5 shadow-card">
        <SelectField
          label="النوع"
          name="type"
          value={form.type}
          onChange={handleChange}
          options={TYPE_OPTIONS}
          required
        />
        <TextField
          label="العنوان الرئيسي (اسم المنطقة)"
          name="mainTitle"
          value={form.mainTitle}
          onChange={handleChange}
          required
          placeholder="مثال: شقة بشارع النيل"
        />
        <TextField
          label="العنوان التفصيلي"
          name="detailedAddress"
          value={form.detailedAddress}
          onChange={handleChange}
          required
          placeholder="مثال: المعادي، القاهرة"
        />
        <TextAreaField
          label="الوصف (اختياري)"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="وصف تفصيلي للعقار…"
        />
        <TextField
          label="السعر (ج.م)"
          name="price"
          type="number"
          min={0}
          value={form.price}
          onChange={handleChange}
          required
          placeholder="0"
        />
      </div>

      {/* الحقول الخاصة بكل نوع (تظهر فقط عند الصلة) */}
      {(category === 'apartment' || category === 'villa' || category === 'house' || category === 'land') && (
        <div className="grid grid-cols-1 gap-4 rounded-card border border-border bg-card p-5 shadow-card sm:grid-cols-2">
          {category === 'apartment' && (
            <TextField
              label="عدد الطوابق (اختياري)"
              name="floors"
              type="number"
              min={0}
              value={form.floors}
              onChange={handleChange}
              placeholder="اتركه فارغاً إن لم ينطبق"
            />
          )}
          {(category === 'villa' || category === 'house' || category === 'land') && (
            <TextField
              label="المساحة (م²) (اختياري)"
              name="area"
              type="number"
              min={0}
              value={form.area}
              onChange={handleChange}
              placeholder="اتركه فارغاً إن لم ينطبق"
            />
          )}
          {(category === 'villa' || category === 'house') && (
            <TextField
              label="عدد الغرف (اختياري)"
              name="rooms"
              type="number"
              min={0}
              value={form.rooms}
              onChange={handleChange}
              placeholder="اتركه فارغاً إن لم ينطبق"
            />
          )}
        </div>
      )}

      {/* ===== إدارة الصور (منطق ذكي: لا تُحذف القديمة تلقائياً) ===== */}
      <div className="space-y-4 rounded-card border border-border bg-card p-5 shadow-card">
        <h2 className="text-sm font-bold text-dark-gray">الصور</h2>

        {/* الصور الحالية (المتبقية) مع زر X لحذف كل صورة */}
        {existingImages.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-dark-gray/55">
              الصور الحالية ({existingImages.length}) — اضغط X لحذف صورة محددة.
            </p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {existingImages.map((path) => (
                <div
                  key={path}
                  className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-dark-gray/10"
                >
                  <img
                    src={resolveImageUrl(path)}
                    alt="صورة حالية"
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(path)}
                    aria-label="حذف هذه الصورة"
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-dark-surface/90 text-red-400 shadow-lg transition-all duration-300 hover:bg-red-500 hover:text-white"
                  >
                    <IconClose className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* الصور الجديدة المختارة (معاينة) مع زر X */}
        {newImages.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-dark-gray/55">صور جديدة ({newImages.length})</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {newImages.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square overflow-hidden rounded-xl ring-2 ring-accent/40"
                >
                  <img
                    src={previewUrls[item.id]}
                    alt={item.file.name}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                    جديدة
                  </span>
                  <button
                    type="button"
                    onClick={() => removeNewImage(item.id)}
                    aria-label="إزالة هذه الصورة الجديدة"
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-dark-surface/90 text-red-400 shadow-lg transition-all duration-300 hover:bg-red-500 hover:text-white"
                  >
                    <IconClose className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* زر إضافة صور جديدة (input file مخصص) */}
        <div>
          <input
            ref={fileInputRef}
            id="new-images-input"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFilesChange}
            className="hidden"
          />
          <label
            htmlFor="new-images-input"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-gray/15 bg-soft-beige px-4 py-4 text-sm font-semibold text-dark-gray/70 transition-all duration-300 hover:border-accent/40 hover:bg-soft-blue hover:text-accent"
          >
            <IconCamera className="h-5 w-5" />
            إضافة صور جديدة (يمكن اختيار أكثر من صورة)
          </label>
        </div>
      </div>

      {/* ===== روابط الفيديو (اختياري) ===== */}
      <div className="space-y-4 rounded-card border border-border bg-card p-5 shadow-card">
        <div>
          <h2 className="text-sm font-bold text-dark-gray">الفيديوهات (اختياري)</h2>
          <p className="mt-1 text-xs text-dark-gray/55">
            الصق رابط الفيديو (يوتيوب أو رابط ملف مباشر مثل Cloudinary). تظهر الفيديوهات أولاً في معرض العقار.
          </p>
        </div>

        {videoUrls.map((url, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1">
              <TextField
                label={`رابط الفيديو ${index + 1}`}
                name={`video-${index}`}
                value={url}
                onChange={(e) => updateVideoField(index, e.target.value)}
                placeholder="https://youtu.be/… أو https://res.cloudinary.com/…/video.mp4"
                dir="ltr"
              />
            </div>
            <button
              type="button"
              onClick={() => removeVideoField(index)}
              aria-label="حذف هذا الرابط"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soft-beige text-red-500 transition-all duration-300 hover:bg-red-500 hover:text-white"
            >
              <IconClose className="h-4 w-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addVideoField}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-gray/15 bg-soft-beige px-4 py-4 text-sm font-semibold text-dark-gray/70 transition-all duration-300 hover:border-accent/40 hover:bg-soft-blue hover:text-accent"
        >
          <IconPlus className="h-5 w-5" />
          إضافة رابط جديد
        </button>
      </div>

      {/* الحالات (مميز / مخفي) */}
      <div className="flex flex-wrap gap-6 rounded-card border border-border bg-card p-5 shadow-card">
        <ToggleSwitch
          checked={form.isFeatured}
          onChange={(v) => setForm((prev) => ({ ...prev, isFeatured: v }))}
          label="مميز"
        />
        <span className="text-sm font-semibold text-dark-gray">مميز (يظهر في الصفحة الرئيسية)</span>

        <ToggleSwitch
          checked={form.isHidden}
          onChange={(v) => setForm((prev) => ({ ...prev, isHidden: v }))}
          label="مخفي"
        />
        <span className="text-sm font-semibold text-dark-gray">مخفي (لا يظهر في الموقع)</span>
      </div>

      {/* زر الحفظ */}
      <div className="flex justify-start">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-button bg-accent px-8 py-3 text-sm font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95 disabled:opacity-60"
        >
          {saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}
        </button>
      </div>
    </form>
  );
}