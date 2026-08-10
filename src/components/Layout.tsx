import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Wrench,
  ChefHat,
  Factory,
  ShoppingBag,
  Settings,
} from 'lucide-react'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/production', icon: Factory, label: 'Produce' },
  { to: '/sales', icon: ShoppingBag, label: 'Sales' },
  { to: '/recipes', icon: ChefHat, label: 'Recipes' },
  { to: '/supplies', icon: Package, label: 'Supplies' },
  { to: '/assets', icon: Wrench, label: 'Assets' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border safe-area-bottom z-50">
      <div className="flex overflow-x-auto scrollbar-hide px-1 py-1 gap-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-[4.5rem] py-1.5 px-1 rounded-xl text-[10px] font-medium transition-colors ${
                isActive ? 'text-matcha-dark bg-matcha/10' : 'text-ink-muted'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            <span className="mt-0.5">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh pb-20">
      <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍡</span>
          <div>
            <div className="font-bold text-ink leading-tight">Mochi Production</div>
            <div className="text-[10px] text-ink-muted">Cost & Profit Dashboard</div>
          </div>
        </div>
      </header>
      <main className="px-4 py-4 max-w-lg mx-auto">{children}</main>
      <BottomNav />
    </div>
  )
}
