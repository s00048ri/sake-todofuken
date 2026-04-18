import { NavLink, Outlet } from 'react-router-dom';
import { useI18n } from '../i18n/index.jsx';

export default function Layout() {
  const { t, lang, setLang } = useI18n();

  const TABS = [
    { path: '/', label: t('nav.race') },
    { path: '/map', label: t('nav.map') },
    { path: '/explore', label: t('nav.explore') },
    { path: '/shipment', label: t('nav.shipment') },
    { path: '/sources', label: t('nav.sources') },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-stone-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{t('site.title')}</h1>
            <p className="text-stone-400 text-sm">{t('site.subtitle')}</p>
          </div>
          {/* 言語切替 */}
          <div className="flex rounded overflow-hidden border border-stone-700 shrink-0">
            <button
              onClick={() => setLang('ja')}
              className={`px-2 py-1 text-xs font-medium transition-colors ${
                lang === 'ja'
                  ? 'bg-stone-100 text-stone-900'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              aria-pressed={lang === 'ja'}
              title="日本語"
            >
              日本語
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 text-xs font-medium transition-colors ${
                lang === 'en'
                  ? 'bg-stone-100 text-stone-900'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
              aria-pressed={lang === 'en'}
              title="English"
            >
              EN
            </button>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-4 flex gap-1 flex-wrap">
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  isActive
                    ? 'bg-stone-50 text-stone-900'
                    : 'text-stone-400 hover:text-stone-200'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-stone-100 border-t border-stone-200 text-stone-600 text-xs py-4 px-4">
        <div className="max-w-5xl mx-auto space-y-1">
          <p>
            <span className="font-bold">{t('footer.dataSources')} </span>
            {t('footer.sourcesList')}
          </p>
          <p className="text-stone-500">
            {t('footer.seeDetails')}{' '}
            <NavLink to="/sources" className="text-blue-600 hover:underline">
              {t('footer.sourcesPage')}
            </NavLink>
            {t('footer.seeDetailsEnd')}
          </p>
        </div>
      </footer>
    </div>
  );
}
