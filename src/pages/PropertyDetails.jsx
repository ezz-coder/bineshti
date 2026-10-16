import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  IconArrowLeft,
  IconBed,
  IconLayers,
  IconMapPin,
  IconPhone,
  IconRuler,
} from '../components/icons';
import { CATEGORIES, resolveImageUrl } from '../utils/constants';
import {
  buildCallHref,
  buildPropertyMessage,
  buildWhatsappHref,
  isWhatsappNumber,
} from '../utils/contact';
import api from '../services/api';

// ===== مساعدات ذكية للحقول الفارغة =====

function hasPositiveNumber(value) {
  const n = Number(value);
  return value !== null && value !== undefined && value !== '' && !Number.isNaN(n) && n > 0;
}

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

// ===== معرض صور كبير (scroll-snap) =====

function DetailsGallery({ images, alt }) {
  const [index, setIndex] = useState(0);
  const total = images.length;

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const width = el.clientWidth || 1;
    const current = Math.round(Math.abs(el.scrollLeft) / width);
    setIndex(Math.min(Math.max(current, 0), Math.max(total - 1, 0)));
  };

  if (total === 0) {
    return (
      <div className="flex h-72 w-full items-center justify-center bg-soft-blue sm:h-96">
        <span className="text-sm font-medium text-dark-gray/50">لا توجد صور</span>
      </div>
    );
  }

  return (
    <div className="relative h-72 w-full overflow-hidden bg-soft-blue sm:h-96">
      <div
        onScroll={handleScroll}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
      >
        {images.map((img, i) => {
          const imageUrl = resolveImageUrl(img);
          return (
            <img
              key={i}
              src={imageUrl}
              srcSet={`${imageUrl}?w=400 400w, ${imageUrl}?w=800 800w`}
              sizes="(max-width: 640px) 400px, 800px"
              alt={`${alt} - صورة ${i + 1}`}
              loading="lazy"
              decoding="async"
              fetchpriority="low"
              className="h-full w-full shrink-0 snap-center object-cover"
            />
          );
        })}
      </div>
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-dark-gray/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
        {index + 1}/{total}
      </div>
    </div>
  );
}

// ===== صف تفصيل واحد =====

function DetailRow({ Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-soft-beige px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-dark-surface text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <span className="flex flex-col">
        <span className="text-xs text-dark-gray/55">{label}</span>
        <span className="text-sm font-semibold text-dark-gray">{value}</span>
      </span>
    </div>
  );
}


// ===== صفحة تفاصيل العقار =====
// category: 'apartment' | 'villa' | 'land' (تُمرّر من المسار في App.jsx)

export default function PropertyDetails({ category }) {
  const { t } = useTranslation();
  const { id } = useParams();

  const [property, setProperty] = useState(null);
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const categoryInfo = CATEGORIES[category] || CATEGORIES.apartment;

  // جلب العقار حسب القسم والمعرّف
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await api.get(`${categoryInfo.endpoint}/${id}`);
        const data = res?.data?.data;
        if (!active) return;
        if (data) setProperty(data);
        else setNotFound(true);
      } catch (err) {
        if (!active) return;
        setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id, categoryInfo.endpoint]);

  // جلب أرقام التواصل (اتصال + واتساب) بشكل مستقل (اختياري)
  useEffect(() => {
    let active = true;
    async function loadSettings() {
      try {
        const res = await api.get('/settings');
        const data = res?.data?.data;
        if (active && data) {
          if (typeof data.contactPhone === 'string') setContactPhone(data.contactPhone.trim());
          if (typeof data.whatsappPhone === 'string') setWhatsappPhone(data.whatsappPhone.trim());
        }
      } catch (err) {
        // أرقام التواصل اختيارية — نتجاهل الخطأ
      }
    }
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  // زر الاتصال: tel: — زر الواتساب: wa.me برقم الواتساب مع رسالة بتفاصيل العقار
  const telHref = buildCallHref(contactPhone);
  const whatsappHref = isWhatsappNumber(whatsappPhone)
    ? buildWhatsappHref(whatsappPhone, buildPropertyMessage(property, category))
    : '';
  const hasContactButtons = Boolean(telHref || whatsappHref);

  // ===== حالة: غير موجود (404) =====
  if (!loading && notFound) {
    return (
      <section className="animate-fade-in">
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-soft-blue text-accent">
            <IconMapPin className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-dark-gray">{t('property.notFound')}</h1>
          <p className="mt-3 leading-relaxed text-dark-gray/60">{t('property.notFoundHint')}</p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-button bg-accent px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent/90"
          >
            <IconArrowLeft className="h-4 w-4 rotate-180" />
            {t('property.backHome')}
          </Link>
        </div>
      </section>
    );
  }

  // ===== حالة: تحميل =====
  if (loading) {
    return (
      <section className="animate-fade-in">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="h-72 w-full animate-pulse rounded-2xl bg-soft-blue sm:h-96" />
          <div className="mt-6 space-y-3">
            <div className="h-7 w-2/3 animate-pulse rounded-md bg-soft-blue" />
            <div className="h-4 w-1/2 animate-pulse rounded-md bg-soft-blue/70" />
            <div className="h-3 w-full animate-pulse rounded bg-soft-blue/60" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-soft-blue/60" />
          </div>
        </div>
      </section>
    );
  }

  // ===== العرض =====
  const { mainTitle, detailedAddress, description, price, floors, area, rooms } = property;
  const imagesList = Array.isArray(property.images) ? property.images : [];

  // تجميع التفاصيل الإضافية المتاحة فقط (بدون فراغات)
  const detailRows = [];
  if (category === 'apartment' && hasPositiveNumber(floors)) {
    detailRows.push({ Icon: IconLayers, label: t('property.floors'), value: `${floors}` });
  }
  if ((category === 'villa' || category === 'land') && hasPositiveNumber(area)) {
    detailRows.push({
      Icon: IconRuler,
      label: t('property.area'),
      value: `${area} ${t('property.sqm')}`,
    });
  }
  if (category === 'villa' && hasPositiveNumber(rooms)) {
    detailRows.push({ Icon: IconBed, label: t('property.rooms'), value: `${rooms}` });
  }

  const backPath =
    category === 'apartment' ? '/apartments' : category === 'villa' ? '/villas' : '/lands';

  return (
    <section className="animate-fade-in">
      <div className="mx-auto max-w-4xl px-4 pb-32 pt-4 sm:pb-24">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 text-sm font-medium text-dark-gray/60 transition-all duration-300 hover:text-accent"
        >
          <IconArrowLeft className="h-4 w-4 rotate-180" />
          رجوع
        </Link>

        <div className="mt-4 overflow-hidden rounded-2xl shadow-sm ring-1 ring-dark-gray/5">
          <DetailsGallery images={imagesList} alt={mainTitle || 'عقار'} />
        </div>

        <div className="mt-6">
          {hasText(mainTitle) && (
            <h1 className="text-2xl font-extrabold leading-snug text-dark-gray sm:text-3xl">
              {mainTitle}
            </h1>
          )}
          {hasText(detailedAddress) && (
            <p className="mt-2 flex items-start gap-2 text-sm text-dark-gray/55">
              <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent/70" />
              {detailedAddress}
            </p>
          )}
        </div>

        {hasPositiveNumber(price) && (
          <p className="mt-4 text-3xl font-extrabold text-accent">
            {Number(price).toLocaleString('ar-EG')}
            <span className="mr-1 text-base font-bold text-dark-gray/60">{t('property.egp')}</span>
          </p>
        )}

        {detailRows.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {detailRows.map((row) => (
              <DetailRow key={row.label} Icon={row.Icon} label={row.label} value={row.value} />
            ))}
          </div>
        )}

        {hasText(description) && (
          <div className="mt-6">
            <h2 className="text-lg font-bold text-dark-gray">{t('property.details')}</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-dark-gray/75">{description}</p>
          </div>
        )}

        {/* أزرار التواصل — ديسكتوب: اتصال + واتساب */}
        {hasContactButtons && (
          <div className="mt-8 hidden items-center gap-3 sm:flex">
            {telHref && (
              <a
                href={telHref}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-button bg-accent px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:bg-accent/90 active:scale-95"
              >
                <IconPhone className="h-4 w-4" />
                {t('property.contact')}
              </a>
            )}
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-button bg-[#25D366] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:bg-[#1fb857] active:scale-95"
              >
                تواصل عبر واتساب
              </a>
            )}
          </div>
        )}
      </div>

      {/* أزرار التواصل — موبايل: شريط عائم */}
      {hasContactButtons && (
        <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 flex gap-2 px-4 sm:hidden">
          {telHref && (
            <a
              href={telHref}
              className="flex flex-1 items-center justify-center gap-2 rounded-button bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:bg-accent/90 active:scale-95"
            >
              <IconPhone className="h-5 w-5" />
              {t('property.contact')}
            </a>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-button bg-[#25D366] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.03] hover:bg-[#1fb857] active:scale-95"
            >
              واتساب
            </a>
          )}
        </div>
      )}
    </section>
  );
}

