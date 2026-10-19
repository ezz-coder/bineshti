import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import PropertyCard from '../components/PropertyCard';
import PropertySkeletonDisabled from '../components/PropertySkeleton';
import TypeToggle from '../components/TypeToggle';
import Pagination from '../components/Pagination';
import { CATEGORIES, TYPE_LABEL_MAP } from '../utils/constants';
import useProperties from '../hooks/useProperties';
import useSettings from '../hooks/useSettings';

// صفحة قسم الفلل مع فلتر إيجار/تمليك.
export default function Villas() {
  const { t } = useTranslation();
  const [typeKey, setTypeKey] = useState('all');
  const [page, setPage] = useState(1);
  const { contactPhone, whatsappPhone } = useSettings();

  const category = CATEGORIES.villa;
  const { data: items, loading, error } = useProperties(category.endpoint, { type: typeKey === 'all' ? undefined : TYPE_LABEL_MAP[typeKey] });

  return (
    <section className="animate-fade-in">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 sm:pb-20 lg:px-8">
        <div className="mb-4 flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold text-dark-gray sm:text-3xl">{category.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-dark-gray/60 sm:text-base">
            {t('sections.villa')}
          </p>
        </div>

        {/* شريط الفلتر — Sticky تحت الهيدر مباشرة */}
        <div className="glass-effect sticky top-36 z-10 border-b border-border bg-sticky-bg py-3 backdrop-blur-sm sm:top-44">
          <div className="flex justify-center">
            <TypeToggle value={typeKey} onChange={setTypeKey} showAll />
          </div>
        </div>

        <div className="mt-8">
          {loading && <PropertySkeletonDisabled count={3} />}

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
            <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 lg:max-w-6xl">
              {items.map((item) => (
                <PropertyCard
                  key={item.id}
                  property={item}
                  category="villa"
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
