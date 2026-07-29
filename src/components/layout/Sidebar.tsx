import { NavLink } from 'react-router-dom';

const navigation = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: "Today's Focus", path: '/focus' },
  { label: 'Health Snapshot', path: '/health' },
  { label: 'Journal', path: '/journal' },
  { label: 'Streaks', path: '/streaks' },
  { label: 'Settings', path: '/settings' },
];

function linkClass(isActive: boolean) {
  return [
    'block rounded-2xl px-4 py-3 text-sm font-medium transition',
    isActive
      ? 'bg-slate-800 text-white'
      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
  ].join(' ');
}

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/95 p-5 shadow-sm shadow-black/30 lg:flex">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Atlas</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">Personal OS</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">A calm, intentional place to organize your day.</p>
      </div>

      <nav className="mt-8 space-y-2">
        {navigation.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
