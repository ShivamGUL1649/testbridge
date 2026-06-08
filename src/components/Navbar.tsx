import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpenCheck,
  Bot,
  ClipboardList,
  Home,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type NavbarProps = {
  profile: UserProfile | null
}

function getRoleLabel(role: string): string {
  if (role === 'ADMIN') return 'Admin'
  if (role === 'TUTOR') return 'Test Creator'
  if (role === 'STUDENT') return 'Test Taker'
  return role
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
      <Link to="/" className="navbar-brand">
        <div className="navbar-brand-icon">
          <BookOpenCheck size={24} />
        </div>

        <div>
          <strong>TestBridge</strong>
        </div>
      </Link>

      <nav className="navbar-links">
        <NavLink to="/" className="nav-link">
          <Home size={17} />
          Home
        </NavLink>

        {profile?.role === 'STUDENT' ? (
          <>
            <NavLink to="/student" className="nav-link">
              <LayoutDashboard size={17} />
              Dashboard
            </NavLink>

            <NavLink to="/student/exams" className="nav-link">
              <ClipboardList size={17} />
              Available Tests
            </NavLink>

            <NavLink to="/student/results" className="nav-link">
              <BookOpenCheck size={17} />
              My Results
            </NavLink>
          </>
        ) : null}

        {profile?.role === 'TUTOR' ? (
          <>
            <NavLink to="/tutor" className="nav-link">
              <LayoutDashboard size={17} />
              Dashboard
            </NavLink>

            <NavLink to="/tutor/exams" className="nav-link">
              <ClipboardList size={17} />
              My Tests
            </NavLink>

            <NavLink to="/tutor/exam/create" className="nav-link">
              <BookOpenCheck size={17} />
              Create Test
            </NavLink>
          </>
        ) : null}

        {profile?.role === 'ADMIN' ? (
          <>
            <NavLink to="/admin" className="nav-link">
              <LayoutDashboard size={17} />
              Dashboard
            </NavLink>

            <NavLink to="/admin/exams/pending" className="nav-link">
              <ShieldCheck size={17} />
              Manage Tests
            </NavLink>

            <NavLink to="/admin/ai-test-generator" className="nav-link">
              <Bot size={17} />
              AI Test Generator
            </NavLink>

            <NavLink to="/admin/settings" className="nav-link">
              <Settings size={17} />
              Settings
            </NavLink>
          </>
        ) : null}
      </nav>

      <div className="navbar-user">
        {profile ? (
          <>
            <div className="user-pill">
              <strong>{profile.name}</strong>
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
            <Link to="/login" className="secondary-button">
              Login
            </Link>

            <Link to="/register" className="primary-button">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  )
}

export default Navbar