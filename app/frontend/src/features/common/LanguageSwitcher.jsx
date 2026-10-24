import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language === 'am' ? 'am' : 'en';

  function toggle() {
    const next = current === 'en' ? 'am' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('restaurant_lang', next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title="Switch language / ቋንቋ ቀይር"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium
                 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700
                 text-stone-700 dark:text-stone-200 transition shadow-2xs"
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{current === 'en' ? 'EN' : 'አማ'}</span>
    </button>
  );
}

export default LanguageSwitcher;
