import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { path: '/', label: 'レース' },
  { path: '/map', label: '地図' },
  { path: '/explore', label: '探索' },
  { path: '/shipment', label: '出荷・輸出' },
  { path: '/sources', label: '出典' },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-stone-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">日本酒の地理学</h1>
          <p className="text-stone-400 text-sm">都道府県別清酒生産量の変遷 1963-2024</p>
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
            <span className="font-bold">データ出典: </span>
            国税庁統計年報（時系列Excel・e-Stat）、清酒製造業の概況、酒類製造業及び酒類卸売業の概況、清酒の製造状況等について
          </p>
          <p className="text-stone-500">
            詳細は <NavLink to="/sources" className="text-blue-600 hover:underline">出典ページ</NavLink> をご覧ください。
            データは公的統計を統合・加工したものです。
          </p>
        </div>
      </footer>
    </div>
  );
}
