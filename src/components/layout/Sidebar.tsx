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
    'block rounded-2xl px-4 py-3 text-sm font-medium transition',
    isActive
      ? 'bg-white text-black'
      : 'text-zinc-300 hover:bg-white/10 hover:text-white',
  ].join(' ');
}

export function Sidebar() {
  return (
    <aside className="sticky top-4 hidden h-fit w-[260px] shrink-0 flex-col gap-4 rounded-[30px] border border-white/10 bg-[#060606]/90 p-4 lg:flex">
      <div className="px-1 py-1">
        <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Atlas</p>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-white">Daily rhythm</h1>
      </div>

      <nav className="mt-2 space-y-1.5">
        {navigation.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => linkClass(isActive)}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
