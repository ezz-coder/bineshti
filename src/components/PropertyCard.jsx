import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { IconArrowLeft, IconBed, IconCamera, IconLayers, IconMapPin, IconPhone, IconRuler } from './icons';
import {
  buildCallHref,
  buildPropertyMessage,
  buildWhatsappHref,
  isWhatsappNumber,
} from '../utils/contact';
import { resolveImageUrl } from '../utils/constants';

// ===== خرائط مساعدة =====

// ربط مفتاح القسم (category) باسم نوع العقار المعروض في الشارة
const CATEGORY_LABEL_MAP = {
  apartment: 'شقة',
  villa: 'فيلا',
  land: 'أرض فارغة',
};

// ===== مساعدات ذكية للتعامل مع الحقول الفارغة =====

// رقم "حقيقي" وموجب (يتجاهل null/undefined/""/0/NaN)
function hasPositiveNumber(value) {
  const n = Number(value);
  return value !== null && value !== undefined && value !== '' && !Number.isNaN(n) && n > 0;
}

// نص غير فارغ
function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

// ===== معرض صور بسيط بسحب أفقي (scroll-snap) =====

function ImageGallery({ images, alt, heightClass = 'h-32 sm:h-56' }) {
  const scrollerRef = useRef(null);
  const [index, setIndex] = useState(0);
  const total = images.length;

  // تحديث الفهرس الحالي أثناء السحب مع مراعاة اتجاه RTL
  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const width = el.clientWidth || 1;
    const current = Math.round(Math.abs(el.scrollLeft) / width);
    setIndex(Math.min(Math.max(current, 0), Math.max(total - 1, 0)));
  };

  // لا توجد صور: اعرض عنصراً بديلاً أنيقاً (بدون فراغ أو كسر)
  if (total === 0) {
    return (
      <div className={`relative flex ${heightClass} items-center justify-center overflow-hidden bg-soft-blue`}>
        <div className="flex flex-col items-center gap-2 text-accent/60">
          <IconCamera className="h-8 w-8" />
          <span className="text-xs font-medium">لا توجد صور</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${heightClass} overflow-hidden bg-soft-blue`}>
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((img, i) => (
          <img
            key={i}
            src={resolveImageUrl(img)}
            alt={`${alt} - صورة ${i + 1}`}
            loading="lazy"
            className="h-full w-full shrink-0 snap-center object-cover transition-transform duration-300 hover:scale-105"
          />
        ))}
      </div>

      {/* مؤشر عدد الصور الحالي/الإجمالي */}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-dark-gray/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
        {index + 1}/{total}
      </div>
    </div>
  );
}

// ===== شارة تفصيل إضافي واحدة =====

function MetaChip({ Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-soft-blue px-2.5 py-1 text-xs font-medium text-dark-gray/80">
      <Icon className="h-4 w-4 text-accent" />
      {children}
    </span>
  );
}

// ===== شارة نوع (لون قابل للتخصيص) =====

function Badge({ children, tone = 'neutral' }) {
  const tones = {
    contract: 'bg-accent/10 text-accent', // نوع العقد (إيجار/تمليك)
    category: 'bg-soft-blue text-accent', // نوع العقار (شقة/فيلا/أرض)
    neutral: 'bg-soft-blue text-accent',
  };
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${tones[tone] || tones.neutral}`}
    >
      {children}
    </span>
  );
}

// ===== بوكس العقار الموحد =====

export default function PropertyCard({ property, category, contactPhone, whatsappPhone }) {
  const { id, type, mainTitle, detailedAddress, description, price, floors, area, rooms, images } =
    property;

  const imagesList = Array.isArray(images) ? images : [];
  const detailPath = `/${category}/${id}`;

  // زر الاتصال: tel: برقم الاتصال — يظهر فقط ان وُجد الرقم
  const callHref = buildCallHref(contactPhone);

  // زر الواتساب: wa.me برقم الواتساب + رسالة بتفاصيل هذا العقار — يظهر فقط ان وُجد رقم صالح
  const whatsappHref = isWhatsappNumber(whatsappPhone)
    ? buildWhatsappHref(whatsappPhone, buildPropertyMessage(property, category))
    : '';

  // اسم نوع العقار من القسم (شقة/فيلا/أرض فارغة)
  const categoryLabel = CATEGORY_LABEL_MAP[category];

  // هل يوجد أي تفصيل إضافي لعرضه؟ (لتجنّب ترك فراغ)
  const hasMetaChips =
    (category === 'apartment' && hasPositiveNumber(floors)) ||
    ((category === 'villa' || category === 'land') && hasPositiveNumber(area)) ||
    (category === 'villa' && hasPositiveNumber(rooms));

  return (
    <article className="glass-effect flex flex-col overflow-hidden rounded-card border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      {/* 1) معرض الصور */}
      <Link to={detailPath} aria-label={mainTitle || 'تفاصيل العقار'}>
        <ImageGallery images={imagesList} alt={mainTitle || 'عقار'} />
      </Link>

      {/* المحتوى */}
      <div className="flex flex-1 flex-col p-4 lg:p-5">
        {/* 2) شارات النوع (نوع العقد + نوع العقار) في صف واحد */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {hasText(type) && <Badge tone="contract">{type}</Badge>}
          {categoryLabel && <Badge tone="category">{categoryLabel}</Badge>}
        </div>

        {/* 3) العنوان الرئيسي (اسم المنطقة) */}
        {hasText(mainTitle) && (
          <h3 className="text-sm font-semibold leading-snug text-dark-gray sm:text-base lg:text-lg">
            <Link to={detailPath} className="transition-colors duration-200 hover:text-accent">
              {mainTitle}
            </Link>
          </h3>
        )}

        {/* 4) العنوان التفصيلي */}
        {hasText(detailedAddress) && (
          <p className="mt-1 flex items-start gap-1 text-xs text-muted sm:text-sm">
            <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent/70" />
            <span className="line-clamp-2">{detailedAddress}</span>
          </p>
        )}

        {/* 5) السعر — لا يُعرض إطلاقاً إن كان فارغاً أو 0 أو null */}
        {hasPositiveNumber(price) && (
          <p className="mt-3 text-lg font-extrabold text-accent sm:text-xl">
            {Number(price).toLocaleString('ar-EG')}
            <span className="mr-1 text-sm font-bold text-dark-gray/60">ج.م</span>
          </p>
        )}

        {/* 6) التفاصيل الإضافية (Conditional Rendering — لا نعرض إلا الحقول الموجودة) */}
        {hasMetaChips && (
          <div className="mt-3 flex flex-wrap gap-2">
            {category === 'apartment' && hasPositiveNumber(floors) && (
              <MetaChip Icon={IconLayers}>{floors} طوابق</MetaChip>
            )}
            {category === 'villa' && hasPositiveNumber(area) && (
              <MetaChip Icon={IconRuler}>{area} م²</MetaChip>
            )}
            {category === 'villa' && hasPositiveNumber(rooms) && (
              <MetaChip Icon={IconBed}>{rooms} غرف</MetaChip>
            )}
            {category === 'land' && hasPositiveNumber(area) && (
              <MetaChip Icon={IconRuler}>{area} م²</MetaChip>
            )}
          </div>
        )}

        {/* 7) الوصف المختصر */}
        {hasText(description) && (
          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-dark-gray/70 sm:text-base">{description}</p>
        )}

        {/* 8) الأزرار: اتصال + واتساب + التفاصيل */}
        <div className="mt-4 flex flex-col gap-2 border-t border-dark-gray/5 pt-4">
          {(callHref || whatsappHref) && (
            <div className="flex items-center gap-2">
              {callHref && (
                <a
                  href={callHref}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-button bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-accent/90 active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <IconPhone className="h-4 w-4" />
                  اتصال
                </a>
              )}
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-button bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-[#1fb857] active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  تواصل واتساب
                </a>
              )}
            </div>
          )}
          <Link
            to={detailPath}
            className="inline-flex w-full items-center justify-center gap-2 rounded-button bg-soft-blue px-3 py-1.5 text-xs font-semibold text-dark-gray transition-all duration-200 hover:scale-105 hover:bg-soft-blue/70 active:scale-95 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            مزيد من التفاصيل
            <IconArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

