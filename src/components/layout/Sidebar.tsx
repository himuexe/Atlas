import { NavLink } from 'react-router-dom';

const navigation = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: "Today's Focus", path: '/focus' },
  { label: 'Health Snapshot', path: '/health' },
  { label: 'Journal', path: '/journal' },
  { label: 'Streaks', path: '/streaks' },
  { label: 'Savings', path: '/savings' },
  { label: 'Goals', path: '/goals' },
  { label: 'Notes', path: '/notes' },
  { label: 'Settings', path: '/settings' },
];

function linkClass(isActive: boolean) {
  return [
    'block rounded-lg px-3 py-2.5 text-sm transition',
    isActive
      ? 'bg-white text-black font-medium'
      : 'text-zinc-500 hover:bg-white/[0.06] hover:text-white',
  ].join(' ');
}

export function Sidebar() {
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-48px)] w-[220px] shrink-0 flex-col border-r border-white/10 pr-6 lg:flex">
      <div className="px-3 py-2">
        <h1 className=" font-medium uppercase tracking-[0.28em] text-white">Atlas</h1>
      </div>

      <nav className="mt-8 space-y-1">
        {navigation.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <p className="mt-auto px-3 pb-2 text-[11px] leading-5 text-zinc-600">Less noise. More intention.</p>
    </aside>
  );
}
