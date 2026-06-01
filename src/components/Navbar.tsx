import { Link, NavLink, useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut } from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type NavbarProps = {
  profile: UserProfile | null
}

function Navbar({ profile }: NavbarProps) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  function getDashboardPath() {
    if (profile?.role === 'ADMIN') return '/admin'
    if (profile?.role === 'TUTOR') return '/tutor'
    return '/student'
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-brand-icon">
          <GraduationCap size={24} />
        </span>
        <span>TestBridge</span>
      </Link>

      {profile ? (
        <>
          <nav className="navbar-links">
            <NavLink to={getDashboardPath()} className="nav-link">
              Dashboard
            </NavLink>

            {profile.role === 'STUDENT' ? (
              <>
                <NavLink to="/student/exams" className="nav-link">
                  Exams
                </NavLink>
                <NavLink to="/student/results" className="nav-link">
                  Results
                </NavLink>
              </>
            ) : null}

            {profile.role === 'TUTOR' ? (
              <>
                <NavLink to="/tutor/exam/create" className="nav-link">
                  Create Exam
                </NavLink>
                <NavLink to="/tutor/exams" className="nav-link">
                  My Exams
                </NavLink>
              </>
            ) : null}

            {profile.role === 'ADMIN' ? (
              <NavLink to="/admin/exams/pending" className="nav-link">
                Pending Exams
              </NavLink>
            ) : null}
          </nav>

          <div className="navbar-user">
            <div className="user-pill">
              <strong>{profile.name}</strong>
              <span>{profile.role}</span>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => void handleLogout()}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </>
      ) : (
        <nav className="navbar-links">
          <NavLink to="/login" className="nav-link">
            Login
          </NavLink>
          <NavLink to="/register" className="nav-link">
            Register
          </NavLink>
        </nav>
      )}
    </header>
  )
}

export default Navbar