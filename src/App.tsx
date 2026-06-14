import { useCallback, useEffect, useState } from 'react'
import {
  BrowserRouter,
  Link,
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
import MaintenancePage from './pages/MaintenancePage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminAiTestGeneratorPage from './pages/AdminAiTestGeneratorPage'
import AdminAiTestsPage from './pages/AdminAiTestsPage'
import AdminAiTestReviewPage from './pages/AdminAiTestReviewPage'

type AppSettings = {
  id: string
  maintenance_mode: boolean
  maintenance_message: string
  updated_at: string
}

const defaultMaintenanceMessage =
  'TestBridge is currently under maintenance. Please try again later.'

function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">TestBridge Online Testing Platform</p>
          <h1>Secure online tests for Test Takers, Test Creators, and Admins.</h1>

          <p className="hero-description">
            Create tests, approve assessments, attempt tests with timers,
            calculate results, and review explanations after submission.
          </p>

          <div className="hero-actions">
            <Link to="/login" className="primary-button">
              Login
            </Link>

            <Link to="/register" className="secondary-button">
              Create Account
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-header">
            <span>System Flow</span>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>Test Creator</strong>
              <span>Create test in Draft mode</span>
            </div>

            <div className="flow-item">
              <strong>Admin</strong>
              <span>Approve, edit, or delete tests</span>
            </div>

            <div className="flow-item">
              <strong>Test Taker</strong>
              <span>Attempt approved tests securely</span>
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

async function loadAppSettings(): Promise<AppSettings | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('id, maintenance_mode, maintenance_message, updated_at')
    .eq('id', 'global')
    .maybeSingle()

  if (error) {
    console.error('Unable to load app settings:', error.message)
    return null
  }

  return data as unknown as AppSettings | null
}

function getDashboardPath(profile: UserProfile | null): string {
  if (profile?.role === 'ADMIN') return '/admin'
  if (profile?.role === 'TUTOR') return '/tutor'
  return '/student'
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [startupError, setStartupError] = useState('')

  const maintenanceMode = appSettings?.maintenance_mode ?? false
  const maintenanceMessage =
    appSettings?.maintenance_message || defaultMaintenanceMessage

  const loadAuthState = useCallback(async () => {
    setIsLoading(true)
    setStartupError('')

    try {
      const loadedSettings = await loadAppSettings()
      setAppSettings(loadedSettings)

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

      window.setTimeout(async () => {
        if (!isMounted) return

        try {
          const [userProfile, loadedSettings] = await Promise.all([
            loadUserProfile(currentSession.user),
            loadAppSettings(),
          ])

          if (!isMounted) return

          setProfile(userProfile)
          setAppSettings(loadedSettings)

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

  if (maintenanceMode && profile?.role !== 'ADMIN') {
    return (
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route
              path="/login"
              element={<LoginPage onLoginSuccess={refreshAuthState} />}
            />

            <Route
              path="*"
              element={
                <MaintenancePage
                  message={maintenanceMessage}
                  showLoginButton
                />
              }
            />
          </Routes>
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

          <Route
            path="/admin/exam/:examId/questions"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['ADMIN']}
                isLoading={false}
              >
                <AddQuestionsPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['ADMIN']}
                isLoading={false}
              >
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ai-test-generator"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['ADMIN']}
                isLoading={false}
              >
                <AdminAiTestGeneratorPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ai-tests"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['ADMIN']}
                isLoading={false}
              >
                <AdminAiTestsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ai-tests/:testId/review"
            element={
              <ProtectedRoute
                profile={profile}
                allowedRoles={['ADMIN']}
                isLoading={false}
              >
                <AdminAiTestReviewPage profile={profile as UserProfile} />
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