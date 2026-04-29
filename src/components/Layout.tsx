import { NavLink, Outlet } from 'react-router-dom'
import { Car, Wrench, Bell, LayoutDashboard, Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useData } from '../context/DataContext'
import { useAuth } from '../context/AuthContext'
import { evaluateAlert } from '../utils/alerts'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Tableau de bord', end: true },
  { to: '/vehicles', icon: Car, label: 'Véhicules' },
  { to: '/history', icon: Wrench, label: 'Interventions' },
  { to: '/alerts', icon: Bell, label: 'Alertes' },
]

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { data } = useData()
  const { user, signOut } = useAuth()

  const activeAlertCount = data.alerts.filter(a => {
    const vehicle = data.vehicles.find(v => v.id === a.vehicleId)
    if (!vehicle) return false
    const status = evaluateAlert(a, vehicle)
    return status.isDue || status.isOverdue
  }).length

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-700 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Cars Health</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10 hover:text-white'}`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
                {label === 'Alertes' && activeAlertCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {activeAlertCount > 9 ? '9+' : activeAlertCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* User + logout */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-blue-200 text-xs truncate max-w-[160px]">{user?.email}</span>
            <button
              onClick={signOut}
              title="Se déconnecter"
              className="p-2 rounded-lg hover:bg-white/10 text-blue-200 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-blue-600 px-4 py-2 space-y-1">
            {navItems.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'}`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
                {label === 'Alertes' && activeAlertCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {activeAlertCount}
                  </span>
                )}
              </NavLink>
            ))}
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-blue-100 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200">
        Cars Health &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
