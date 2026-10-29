// أدوات بناء روابط الاتصال والواتساب — بدون أي مكتبات خارجية.
// contactPhone  : رقم الاتصال (tel:)
// whatsappPhone : رقم الواتساب (wa.me مع رسالة جاهزة)

/**
 * هل الرقم صالح للواتساب (أرقام فقط مع + اختيارية ومسافات/شرطات)؟
 */
export function isWhatsappNumber(phone) {
  if (typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^\+?\d{7,15}$/.test(cleaned);
}

/**
 * تنظيف الرقم للاستخدام في wa.me (إزالة + والمسافات والشرطات).
 */
export function cleanPhoneForWhatsapp(phone) {
  return String(phone || '').replace(/[\s\-+]/g, '');
}

/**
 * رابط الاتصال المباشر: tel:0123456789
 * يُرجع '' إن كان الرقم فارغاً.
 */
export function buildCallHref(callPhone) {
  const phone = String(callPhone || '').trim();
  if (!phone) return '';
  return `tel:${phone}`;
}

/**
 * رابط الواتساب مع رسالة جاهزة:
 * https://wa.me/2010...?text=... (مرمّزة بـ encodeURIComponent)
 * يُرجع '' إن كان الرقم فارغاً أو غير صالح.
 */
export function buildWhatsappHref(whatsappPhone, message) {
  if (!isWhatsappNumber(whatsappPhone)) return '';
  const number = cleanPhoneForWhatsapp(whatsappPhone);
  const text = String(message || '').trim();
  return text
    ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${number}`;
}

/**
 * رسالة واتساب جاهزة لعقار معيّن:
 * تتضمن النوع (شقة/فيلا/أرض)، نوع العقد، العنوان، السعر، والمساحة/الغرف/الطوابق إن وُجدت.
 * Conditional Rendering: الحقول الفارغة لا تظهر في الرسالة.
 */
export function buildPropertyMessage(property, category) {
  const categoryLabels = { apartment: 'شقة', villa: 'فيلا', house: 'بيت', land: 'أرض' };
  const lines = ['مرحباً، أود الاستفسار عن هذا العقار:'];

  const kind = categoryLabels[category];
  const contractType = property?.type?.trim?.();
  if (kind || contractType) {
    lines.push(`النوع: ${[kind, contractType].filter(Boolean).join(' - ')}`);
  }
  if (property?.mainTitle?.trim?.()) lines.push(`العنوان: ${property.mainTitle.trim()}`);
  if (property?.detailedAddress?.trim?.()) lines.push(`العنوان التفصيلي: ${property.detailedAddress.trim()}`);
  if (Number(property?.price) > 0) {
    lines.push(`السعر: ${Number(property.price).toLocaleString('ar-EG')} ج.م`);
  }
  if (category === 'apartment' && Number(property?.floors) > 0) {
    lines.push(`عدد الطوابق: ${property.floors}`);
  }
  if ((category === 'villa' || category === 'house' || category === 'land') && Number(property?.area) > 0) {
    lines.push(`المساحة: ${property.area} م²`);
  }
  if ((category === 'villa' || category === 'house') && Number(property?.rooms) > 0) {
    lines.push(`عدد الغرف: ${property.rooms}`);
  }
  return lines.join('\n');
}

/** رسالة واتساب العامة من صفحة "من نحن". */
export function buildAboutMessage(companyName) {
  const name = String(companyName || '').trim() || 'بي نيشتي للاستثمار العقاري';
  return `مرحباً، أود التواصل مع أحد ممثلي ${name}.`;
}
