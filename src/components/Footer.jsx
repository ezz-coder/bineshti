import { useTranslation } from 'react-i18next';

import { APP_NAME } from '../utils/constants';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-dark-gray px-4 py-8 text-center text-sm text-white">
      <div className="mx-auto max-w-2xl">
        <p className="text-base font-extrabold sm:text-lg">{APP_NAME}</p>
        <p className="mt-1 text-sm font-semibold text-accent sm:text-base">
          {t('footer.tagline')}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-white/70 sm:text-sm">
          {t('footer.pitch')}
        </p>
        <p className="mt-5 border-t border-white/10 pt-4 text-xs text-white/60">
          © {new Date().getFullYear()} {APP_NAME} — {t('footer.rights')}
        </p>
      </div>
    </footer>
  );
}
