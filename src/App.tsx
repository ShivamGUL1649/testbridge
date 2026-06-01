import { useCallback, useEffect, useState } from 'react'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'
import type { Session, User } from '@supabase/supabase-js'

import './App.css'

import { supabase } from './lib/supabaseClient'
import type { UserProfile } from './types'

import Navbar from './components/Navbar'
import Loading from './components/Loading'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/StudentDashboard'
import TutorDashboard from './pages/TutorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import CreateExamPage from './pages/CreateExamPage'
import TutorExamsPage from './pages/TutorExamsPage'
import AddQuestionsPage from './pages/AddQuestionsPage'
import AdminPendingExamsPage from './pages/AdminPendingExamsPage'
import StudentAvailableExamsPage from './pages/StudentAvailableExamsPage'
import ExamAttemptPage from './pages/ExamAttemptPage'
import StudentResultsPage from './pages/StudentResultsPage'
import StudentResultReviewPage from './pages/StudentResultReviewPage'

function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">TestBridge Online Examination System</p>
          <h1>Secure online exams for Students, Tutors, and Admins.</h1>
          <p className="hero-description">
            Create exams, approve assessments, attempt tests with timers,
            calculate results, and review explanations after submission.
          </p>

          <div className="hero-actions">
            <a href="/login" className="primary-button">
              Login
            </a>
            <a href="/register" className="secondary-button">
              Create Account
            </a>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-header">
            <span>System Flow</span>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>Tutor</strong>
              <span>Create exam in Draft mode</span>
            </div>

            <div className="flow-item">
              <strong>Admin</strong>
              <span>Approve or reject published exams</span>
            </div>

            <div className="flow-item">
              <strong>Student</strong>
              <span>Attempt approved exams securely</span>
            </div>

            <div className="flow-item">
              <strong>Result</strong>
              <span>View score and explanations after submit</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function UnauthorizedPage() {
  return (
    <main className="page-shell">
      <section className="placeholder-card error-card">
        <p className="eyebrow">Access Denied</p>
        <h1>Unauthorized Access</h1>
        <p>You do not have permission to access this page.</p>
      </section>
    </main>
  )
}

async function loadUserProfile(user: User): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, auth_user_id, name, email, role, created_at')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Unable to load user profile:', error.message)
    return null
  }

  return data as unknown as UserProfile | null
}

function getDashboardPath(profile: UserProfile | null): string {
  if (profile?.role === 'ADMIN') return '/admin'
  if (profile?.role === 'TUTOR') return '/tutor'
  return '/student'
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [startupError, setStartupError] = useState('')

  const loadAuthState = useCallback(async () => {
    setIsLoading(true)
    setStartupError('')

    try {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        setSession(null)
        setProfile(null)
        setStartupError(error.message)
        return
      }

      setSession(currentSession)

      if (!currentSession?.user) {
        setProfile(null)
        return
      }

      const userProfile = await loadUserProfile(currentSession.user)

      if (!userProfile) {
        setProfile(null)
        setStartupError(
          'Login session exists, but profile was not found. Please logout and login again.',
        )
        return
      }

      setProfile(userProfile)
    } catch (error) {
      console.error('Auth loading failed:', error)
      setSession(null)
      setProfile(null)
      setStartupError('Unable to load session. Please retry.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshAuthState = useCallback(async () => {
    await loadAuthState()
  }, [loadAuthState])

  useEffect(() => {
    let isMounted = true

    async function initialize() {
      if (!isMounted) return
      await loadAuthState()
    }

    void initialize()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return

      setSession(currentSession)

      if (!currentSession?.user) {
        setProfile(null)
        setIsLoading(false)
        return
      }

      /*
        Important:
        Do not call Supabase profile query directly inside onAuthStateChange.
        Schedule it outside the callback to avoid refresh/tab-switch hanging.
      */
      window.setTimeout(async () => {
        if (!isMounted) return

        try {
          const userProfile = await loadUserProfile(currentSession.user)

          if (!isMounted) return

          setProfile(userProfile)

          if (!userProfile) {
            setStartupError(
              'Login session exists, but profile was not found. Please logout and login again.',
            )
          } else {
            setStartupError('')
          }
        } catch (error) {
          console.error('Profile refresh failed:', error)

          if (isMounted) {
            setProfile(null)
            setStartupError('Unable to refresh user profile.')
          }
        } finally {
          if (isMounted) {
            setIsLoading(false)
          }
        }
      }, 0)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadAuthState])

  if (isLoading) {
    return <Loading />
  }

  if (startupError) {
    return (
      <BrowserRouter>
        <div className="app-container">
          <Navbar profile={profile} />

          <main className="page-shell">
            <section className="placeholder-card error-card">
              <p className="eyebrow">Startup Error</p>
              <h1>Unable to continue</h1>
              <p>{startupError}</p>

              <div className="hero-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void refreshAuthState()}
                >
                  Retry
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={async () => {
                    await supabase.auth.signOut()
                    window.localStorage.clear()
                    window.sessionStorage.clear()
                    window.location.href = '/login'
                  }}
                >
                  Clear Session
                </button>
              </div>
            </section>
          </main>
        </div>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar profile={profile} />

        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/login"
            element={
              session ? (
                <Navigate to={getDashboardPath(profile)} replace />
              ) : (
                <LoginPage onLoginSuccess={refreshAuthState} />
              )
            }
          />

          <Route
            path="/register"
            element={
              session ? (
                <Navigate to={getDashboardPath(profile)} replace />
              ) : (
                <RegisterPage onRegisterSuccess={refreshAuthState} />
              )
            }
          />

          <Route
            path="/student"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['STUDENT']}
                isLoading={false}
              >
                <StudentDashboard profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/exams"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['STUDENT']}
                isLoading={false}
              >
                <StudentAvailableExamsPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/exam/:examId/attempt"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['STUDENT']}
                isLoading={false}
              >
                <ExamAttemptPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/results"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['STUDENT']}
                isLoading={false}
              >
                <StudentResultsPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/results/:attemptId/review"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['STUDENT']}
                isLoading={false}
              >
                <StudentResultReviewPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['TUTOR']}
                isLoading={false}
              >
                <TutorDashboard profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor/exams"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['TUTOR']}
                isLoading={false}
              >
                <TutorExamsPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor/exam/create"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['TUTOR']}
                isLoading={false}
              >
                <CreateExamPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor/exam/:examId/questions"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['TUTOR']}
                isLoading={false}
              >
                <AddQuestionsPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['ADMIN']}
                isLoading={false}
              >
                <AdminDashboard profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/exams/pending"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['ADMIN']}
                isLoading={false}
              >
                <AdminPendingExamsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App