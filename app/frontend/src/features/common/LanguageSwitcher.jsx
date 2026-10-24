import { Globe } from 'lucide-react';
import i18n from '../../i18n';

// toggle between 'en' and 'am', persist to localStorage
function LanguageSwitcher() {
  const current = i18n.language === 'am' ? 'am' : 'en';

  function toggle() {
    const next = current === 'en' ? 'am' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('restaurant_lang', next);
  }

  return (
    <button
      onClick={toggle}
      title="Switch language"
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium
                 text-gray-600 hover:text-gray-900 hover:bg-gray-100
                 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700
                 transition-colors"
    >
      <Globe size={16} />
      <span>{current === 'en' ? 'EN' : 'አማ'}</span>
    </button>
  );
}

export default LanguageSwitcher;
