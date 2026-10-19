import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PropertyCard from '../components/PropertyCard';
import PropertySkeletonDisabled from '../components/PropertySkeleton';
import TypeToggle from '../components/TypeToggle';
import { IconArrowLeft } from '../components/icons';
import api from '../services/api';
import { TYPE_LABEL_MAP } from '../utils/constants';

// ===== مساعدات =====

function normalizeList(value) {
  return Array.isArray(value) ? value : [];
}

// إلحاق نوع القسم بكل عقار حتى نعرف مسار التفاصيل الصحيح في PropertyCard
function tagCategory(items, category) {
  return items.map((item) => ({ ...item, category }));
}

// دمج العقارات وترتيبها بالأحدث ثم أخذ أول عدد مطلوب
function mergeAndSort(groups, limit) {
  const merged = [];
  groups.forEach(([items, category]) => {
    items.forEach((item) => merged.push({ ...item, category }));
  });
  merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return merged.slice(0, limit);
}

// فلترة القائمة حسب نوع العقد المختار (all/rent/buy).
// 'all' أو أي قيمة غير معروفة تعيد القائمة كما هي.
function filterByType(items, typeKey) {
  if (!typeKey || typeKey === 'all') return items;
  const label = TYPE_LABEL_MAP[typeKey];
  if (!label) return items;
  return items.filter((item) => item.type === label);
}

// ===== عنوان قسم مع رابط "عرض الكل" =====

function SectionHeader({ title, subtitle, to }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold text-dark-gray">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm leading-relaxed text-dark-gray/60 sm:text-base">{subtitle}</p>
        )}
      </div>
      {to && (
        <Link
          to={to}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-accent transition-all duration-300 hover:text-accent/80"
        >
          عرض الكل
          <IconArrowLeft className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ===== شبكة عقارات متجاوبة =====

function PropertyGrid({ items, contactPhone, whatsappPhone }) {
  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 lg:max-w-6xl">
      {items.map((item) => (
        <PropertyCard
          key={`${item.category}-${item.id}`}
          property={item}
          category={item.category}
          contactPhone={contactPhone}
          whatsappPhone={whatsappPhone}
        />
      ))}
    </div>
  );
}

// ===== الصفحة الرئيسية =====

export default function Home() {
  const { t } = useTranslation();

  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [featured, setFeatured] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeKey, setTypeKey] = useState('all'); // فلتر نوع العقد: all / rent / buy

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [featuredRes, aptRes, villaRes, landRes, settingsRes] = await Promise.all([
          api.get('/featured'),
          api.get('/apartments'),
          api.get('/villas'),
          api.get('/lands'),
          api.get('/settings'),
        ]);

        if (!active) return;

        // أرقام التواصل
        const settingsData = settingsRes?.data?.data;
        if (settingsData && typeof settingsData.contactPhone === 'string') {
          setPhone(settingsData.contactPhone.trim());
        }
        if (settingsData && typeof settingsData.whatsappPhone === 'string') {
          setWhatsapp(settingsData.whatsappPhone.trim());
        }

        // المميزة: دمج الثلاثة أقسام مع الإشارة للقسم
        const f = featuredRes?.data?.data || {};
        const featuredList = [
          ...tagCategory(normalizeList(f.apartments), 'apartment'),
          ...tagCategory(normalizeList(f.villas), 'villa'),
          ...tagCategory(normalizeList(f.lands), 'land'),
        ];
        setFeatured(featuredList);

        // الأحدث: دمج آخر عقارات الثلاثة أقسام وترتيبها زمنياً
        // نستبعد العقارات المميزة (isFeatured) لأنها معروضة بالفعل في قسم "العناصر المميزة"
        // حتى لا تتكرر في قسم "أحدث العقارات".
        const recentList = mergeAndSort(
          [
            [normalizeList(aptRes?.data?.data).filter((item) => !item.isFeatured), 'apartment'],
            [normalizeList(villaRes?.data?.data).filter((item) => !item.isFeatured), 'villa'],
            [normalizeList(landRes?.data?.data).filter((item) => !item.isFeatured), 'land'],
          ],
          8,
        );
        setRecent(recentList);
      } catch (err) {
        if (!active) return;
        setFeatured([]);
        setRecent([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  // تطبيق فلتر نوع العقد على القائمتين (المميزة والأحدث)
  const visibleFeatured = filterByType(featured, typeKey);
  const visibleRecent = filterByType(recent, typeKey);

  return (
    <section className="animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-20 lg:px-8">
        {/* ترحيب */}
        <div className="mb-8 rounded-2xl bg-soft-blue p-6 text-center sm:p-8 lg:mb-12">
          <h1 className="text-2xl font-bold text-dark-gray sm:text-3xl">{t('home.title')}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-dark-gray/70 sm:text-base">
            {t('home.subtitle')}
          </p>
        </div>

        {/* فلتر نوع العقد (الكل / إيجار / تمليك) — Sticky تحت الهيدر */}
        <div className="glass-effect sticky top-36 z-10 mb-8 flex justify-center border-b border-border bg-sticky-bg py-3 backdrop-blur-sm sm:top-44 lg:mb-12">
          <TypeToggle value={typeKey} onChange={setTypeKey} showAll />
        </div>

        {loading && <PropertySkeletonDisabled count={3} />}

        {!loading && (
          <>
            {/* العناصر المميزة */}
            <div className="mb-8 lg:mb-12">
              <SectionHeader title={t('property.featured')} subtitle={t('property.featuredSub')} />
              {visibleFeatured.length > 0 ? (
                <PropertyGrid items={visibleFeatured} contactPhone={phone} whatsappPhone={whatsapp} />
              ) : (
                <p className="py-10 text-center text-sm font-medium text-dark-gray/60">
                  {t('property.emptyFeatured')}
                </p>
              )}
            </div>

            {/* أحدث العقارات — يفصلها خط خفيف عن قسم المميزة */}
            <div className="mt-8 border-t border-border pt-8 lg:mt-12 lg:pt-12">
              <SectionHeader title={t('property.latest')} subtitle={t('property.latestSub')} />
              {visibleRecent.length > 0 ? (
                <PropertyGrid items={visibleRecent} contactPhone={phone} whatsappPhone={whatsapp} />
              ) : (
                <p className="py-10 text-center text-sm font-medium text-dark-gray/60">
                  {t('property.emptySection')}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

