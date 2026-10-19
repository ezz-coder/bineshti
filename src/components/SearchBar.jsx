import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { IconClose, IconSearch } from './icons';

// أيقونة البحث العائمة في الزاوية العلوية اليمنى، تتمدد إلى حقل إدخال أنيق عند الضغط.
export default function SearchBar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // الانتقال لصفحة البحث الكاملة عند Enter أو زر البحث
  const goToSearch = () => {
    const q = query.trim();
    if (!q) return;
    navigate('/search?q=' + encodeURIComponent(q));
    setOpen(false);
  };

  return (
    <div className="absolute right-4 top-4 z-30 flex flex-col items-center">
      <div
        className={`flex h-10 items-center overflow-hidden rounded-full bg-card shadow-md ring-1 ring-dark-gray/10 transition-all duration-300 sm:h-11 ${
          open ? 'w-[calc(100vw-2rem)] max-w-sm' : 'w-10 sm:w-11'
        }`}
      >
        <button
          type="button"
          aria-label={t('search.label')}
          onClick={open ? goToSearch : () => setOpen(true)}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-dark-gray transition-colors duration-200 hover:text-accent sm:h-11 sm:w-11"
        >
          <IconSearch />
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') goToSearch();
          }}
          placeholder={t('search.placeholder')}
          autoFocus={open}
          className={`h-full flex-1 bg-transparent text-sm text-dark-gray placeholder:text-dark-gray/40 transition-all duration-300 focus:outline-none ${
            open ? 'opacity-100' : 'w-0 opacity-0'
          }`}
        />

        {open && (
          <button
            type="button"
            aria-label={t('search.close')}
            onClick={() => setOpen(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-dark-gray/60 transition-colors duration-200 hover:text-dark-gray sm:h-11 sm:w-11"
          >
            <IconClose />
          </button>
        )}
      </div>
      {/* نص توضيحي أسفل الزر ليتناسق مع زر تبديل الوضع على الجهة المقابلة */}
      <span className="mt-1.5 whitespace-nowrap text-[10px] font-semibold text-dark-gray/70 sm:text-xs">
        {t('search.buttonLabel')}
      </span>
    </div>
  );
}
