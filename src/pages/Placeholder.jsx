import { useTranslation } from 'react-i18next';

import { IconBuilding } from '../components/icons';

// صفحة مؤقتة للأقسام التي سيتم تجهيزها لاحقاً (شقق / فلل / أراضي فارغة).
export default function Placeholder() {
  const { t } = useTranslation();

  return (
    <section className="animate-fade-in">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-soft-blue text-accent">
          <IconBuilding className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-dark-gray sm:text-3xl">
          {t('placeholder.title')}
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-dark-gray/60">
          {t('placeholder.subtitle')}
        </p>
      </div>
    </section>
  );
}
