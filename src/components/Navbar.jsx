import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { t } = useTranslation();

  return (
    <header className="border-b border-dark-gray/10 bg-soft-blue">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold text-dark-gray transition-opacity hover:opacity-70">
          {t('site.name')}
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-dark-gray">
          <Link to="/" className="transition-opacity hover:opacity-70">
            {t('nav.home')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
