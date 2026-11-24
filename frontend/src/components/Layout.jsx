
import {
  LayoutDashboard,
  Users,
  UserRoundCog,
  FileSignature,
  WalletCards,
  Building2,
  Sun,
  Moon,
  LogOut,
  Files,
  UserCircle
} from 'lucide-react'

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'
import { queryClient } from '../lib/queryClient'

const nav = [
  ['/', LayoutDashboard, 'Dashboard'],
  ['/players', Users, 'Players'],
  ['/staff', UserRoundCog, 'Staff'],
  ['/contracts', FileSignature, 'Contracts'],
  ['/payrolls', WalletCards, 'Payroll'],
  ['/documents', Files, 'Documents'],
  ['/club', Building2, 'Club Hub'],
  ['/profile', UserCircle, 'Profile'],
]

export default function Layout() {
  const navigate = useNavigate()

  const [dark, setDark] = useState(
    () => localStorage.theme === 'dark'
  )

  const [loggingOut, setLoggingOut] = useState(false)

  const toggle = () => {
    setDark(!dark)
    localStorage.theme = !dark ? 'dark' : 'light'
    document.documentElement.classList.toggle('dark', !dark)
  }

  const handleLogout = async () => {
    if (loggingOut) return

    setLoggingOut(true)

    try {
      const { error } = await supabase.auth.signOut()

      if (error) throw error

      // Clear all React Query cache
      queryClient.clear()

      // Navigate to login page
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
      alert(error.message || 'Failed to sign out')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <b>FC</b>
          <span>
            FCHRM
            <small>People Operations</small>
          </span>
        </div>

        <nav>
          {nav.map(([to, I, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
            >
              <I />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="aside-actions">
          <button onClick={toggle} title="Toggle theme">
            {dark ? <Sun /> : <Moon />}
            <span>Appearance</span>
          </button>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut />
            <span>
              {loggingOut ? 'Signing out...' : 'Sign out'}
            </span>
          </button>
        </div>
      </aside>

      <main>
        <Outlet />
      </main>

      <nav className="mobile-nav">
        {nav.slice(0, 5).map(([to, I, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={label}
          >
            <I />
            <small>{label}</small>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
