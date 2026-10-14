import { useTranslation } from 'react-i18next';

import { APP_NAME } from '../utils/constants';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-dark-gray py-6 text-center text-sm text-white">
      <p>
        © {new Date().getFullYear()} {APP_NAME} — {t('footer.rights')}
      </p>
    </footer>
  );
}
