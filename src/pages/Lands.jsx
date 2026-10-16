import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import PropertyCard from '../components/PropertyCard';
import PropertySkeletonDisabled from '../components/PropertySkeleton';
import TypeToggle from '../components/TypeToggle';
import Pagination from '../components/Pagination';
import { CATEGORIES, TYPE_LABEL_MAP } from '../utils/constants';
import useProperties from '../hooks/useProperties';
import useSettings from '../hooks/useSettings';

// صفحة قسم الأراضي الفارغة مع فلتر إيجار/تمليك.
export default function Lands() {
  const { t } = useTranslation();
  const [typeKey, setTypeKey] = useState('all');
  const [page, setPage] = useState(1);
  const { contactPhone, whatsappPhone } = useSettings();

  const category = CATEGORIES.land;
  const { data: items, loading, error } = useProperties(category.endpoint, { type: typeKey === 'all' ? undefined : TYPE_LABEL_MAP[typeKey] });

  return (
    <section className="animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-20 lg:px-8">
        <div className="mb-4 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-dark-gray sm:text-3xl">{category.name}</h1>
        </div>

        {/* شريط الفلتر — Sticky تحت الهيدر مباشرة */}
        <div className="glass-effect sticky top-40 z-10 border-b border-border bg-sticky-bg py-3 backdrop-blur-sm sm:top-48">
          <div className="flex justify-center">
            <TypeToggle value={typeKey} onChange={setTypeKey} showAll />
          </div>
        </div>

        <div className="mt-8">
          {loading && <PropertySkeletonDisabled count={8} />}

          {!loading && error && (
            <p className="py-16 text-center text-sm font-medium text-dark-gray/60">
              {t('property.error')}
            </p>
          )}

          {!loading && !error && items.length === 0 && (
            <p className="py-16 text-center text-sm font-medium text-dark-gray/60">
              {t('property.emptySection')}
            </p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 performance-grid">
              {items.map((item) => (
                <PropertyCard
                  key={item.id}
                  property={item}
                  category="land"
                  contactPhone={contactPhone}
                  whatsappPhone={whatsappPhone}
                />
              ))}
            </div>
          )}
        </div>

        {/* تعقّب بالـ Pagination */}
        {!loading && !error && items.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={1}
            onPageChange={setPage}
          />
        )}
      </div>
    </section>
  );
}
