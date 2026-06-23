import { NavLink, useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck } from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type NavbarProps = {
  profile: UserProfile | null
}

function getRoleLabel(role: UserProfile['role']): string {
  if (role === 'ADMIN') return 'Admin'
  if (role === 'TUTOR') return 'Test Creator'
  if (role === 'STUDENT') return 'Test Taker'

  return 'User'
}

function getDashboardPath(role: UserProfile['role']): string {
  if (role === 'ADMIN') return '/admin'
  if (role === 'TUTOR') return '/tutor'
  if (role === 'STUDENT') return '/student'

  return '/'
}

function Navbar({ profile }: NavbarProps) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()

    window.localStorage.clear()
    window.sessionStorage.clear()

    navigate('/login', { replace: true })
  }

  return (
    <header className="navbar">
      <NavLink to="/" className="navbar-brand">
        <span className="navbar-brand-icon">
          <ShieldCheck size={22} />
        </span>

        <span>TestBridge</span>
      </NavLink>

      <nav className="navbar-links">
        <NavLink to="/" className="nav-link">
          Home
        </NavLink>

        <NavLink to="/test-packs" className="nav-link">
          Test Packs
        </NavLink>

        <NavLink to="/about" className="nav-link">
          About
        </NavLink>

        <NavLink to="/contact" className="nav-link">
          Contact
        </NavLink>

        {profile ? (
          <NavLink to={getDashboardPath(profile.role)} className="nav-link">
            Dashboard
          </NavLink>
        ) : null}

        {profile?.role === 'STUDENT' ? (
          <>
            <NavLink to="/student/exams" className="nav-link">
              Practice Tests
            </NavLink>

            <NavLink to="/student/results" className="nav-link">
              My Results
            </NavLink>

            <NavLink to="/student/profile" className="nav-link">
              My Profile
            </NavLink>
          </>
        ) : null}

        {profile?.role === 'TUTOR' ? (
          <>
            <NavLink to="/tutor/exams" className="nav-link">
              My Tests
            </NavLink>

            <NavLink to="/tutor/exam/create" className="nav-link">
              Create Test
            </NavLink>
          </>
        ) : null}

        {profile?.role === 'ADMIN' ? (
          <>
            <NavLink to="/admin/exams/pending" className="nav-link">
              Manage Tests
            </NavLink>

            <NavLink to="/admin/demo-settings" className="nav-link">
              Demo Settings
            </NavLink>

            <NavLink to="/admin/ai-test-generator" className="nav-link">
              Create Test by AI
            </NavLink>

            <NavLink to="/admin/ai-tests" className="nav-link">
              AI Drafts
            </NavLink>

            <NavLink to="/admin/settings" className="nav-link">
              Settings
            </NavLink>
          </>
        ) : null}
      </nav>

      <div className="navbar-user">
        {profile ? (
          <>
            <div className="user-pill">
              <strong>{profile.name || profile.email}</strong>
              <span>{getRoleLabel(profile.role)}</span>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => void handleLogout()}
            >
              <LogOut size={17} />
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-link">
              Login
            </NavLink>

            <NavLink to="/demo" className="primary-button">
              Start Free Demo
            </NavLink>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar
