import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import type { Session, User } from '@supabase/supabase-js'

import './App.css'

import { supabase } from './lib/supabaseClient'
import type { UserProfile } from './types'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Loading from './components/Loading'
import ProtectedRoute from './components/ProtectedRoute'

import HomePage from './pages/HomePage'
import TestPacksPage from './pages/TestPacksPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import GoogleGenAiLeaderPracticePage from './pages/GoogleGenAiLeaderPracticePage'
import CategoryPracticePage from './pages/CategoryPracticePage'
import PublicDemoPage from './pages/PublicDemoPage'
import PublicDemoAttemptPage from './pages/PublicDemoAttemptPage'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import StudentDashboard from './pages/StudentDashboard'
import StudentProfilePage from './pages/StudentProfilePage'
import TutorDashboard from './pages/TutorDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsersPage from './pages/AdminUsersPage'
import AdminPaidInterestPage from './pages/AdminPaidInterestPage'
import AdminCategoriesPage from './pages/AdminCategoriesPage'
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
import AdminDemoSettingsPage from './pages/AdminDemoSettingsPage'

type AppSettings = {
  id: string
  maintenance_mode: boolean
  maintenance_message: string
  updated_at: string
}

type AppUserProfile = UserProfile & {
  is_active?: boolean | null
  is_deleted?: boolean | null
  deleted_at?: string | null
}

const defaultMaintenanceMessage =
  'TestBridge is currently under maintenance. Please try again later.'

const inactiveAccountMessage =
  'Your TestBridge account has been deactivated by the administrator. Please contact support if you think this is a mistake.'

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

function isInactiveProfile(profile: AppUserProfile | null): boolean {
  return Boolean(profile?.is_deleted === true || profile?.is_active === false)
}

async function clearInvalidAuthSession() {
  await supabase.auth.signOut()

  window.localStorage.clear()
  window.sessionStorage.clear()
}

function getRoleFromMetadata(user: User): UserProfile['role'] {
  const metadata = user.user_metadata as Record<string, unknown>
  const metadataRole = String(metadata.role || '').toUpperCase()

  if (metadataRole === 'TUTOR') return 'TUTOR'
  if (metadataRole === 'ADMIN') return 'ADMIN'

  return 'STUDENT'
}

function getNameFromMetadata(user: User): string {
  const metadata = user.user_metadata as Record<string, unknown>
  const metadataName = String(metadata.name || '').trim()

  if (metadataName) {
    return metadataName
  }

  return user.email?.split('@')[0] || 'TestBridge User'
}

function getCategoryIdsFromMetadata(user: User): string[] {
  const metadata = user.user_metadata as Record<string, unknown>
  const categoryIds = metadata.selected_category_ids

  if (!Array.isArray(categoryIds)) {
    return []
  }

  return categoryIds
    .map((categoryId) => String(categoryId))
    .filter(Boolean)
}

async function syncCategoryInterestsFromMetadata(
  profileId: string,
  user: User,
): Promise<void> {
  const categoryIds = getCategoryIdsFromMetadata(user)

  if (categoryIds.length === 0) {
    return
  }

  const { data: categories, error: categoryError } = await supabase
    .from('exam_categories')
    .select('id, slug')
    .in('id', categoryIds)

  if (categoryError || !categories || categories.length === 0) {
    return
  }

  const rows = (categories as Array<{ id: string; slug: string }>).map(
    (category) => ({
      profile_id: profileId,
      category_id: category.id,
      category_slug: category.slug,
      interest_source: 'registration',
      is_active: true,
      updated_at: new Date().toISOString(),
    }),
  )

  await supabase.from('user_category_interests').upsert(rows, {
    onConflict: 'profile_id,category_id',
  })
}

async function createUserProfileFromAuthUser(
  user: User,
): Promise<AppUserProfile | null> {
  const role = getRoleFromMetadata(user)

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      auth_user_id: user.id,
      name: getNameFromMetadata(user),
      email: user.email || '',
      role,
      is_active: true,
      is_deleted: false,
    })
    .select(
      'id, auth_user_id, name, email, role, created_at, is_active, is_deleted, deleted_at',
    )
    .single()

  if (error) {
    console.error('Unable to auto-create user profile:', error.message)
    return null
  }

  const profile = data as unknown as AppUserProfile
  await syncCategoryInterestsFromMetadata(profile.id, user)

  return profile
}

async function loadUserProfile(user: User): Promise<AppUserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, auth_user_id, name, email, role, created_at, is_active, is_deleted, deleted_at',
    )
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Unable to load user profile:', error.message)
    return null
  }

  if (data) {
    const profile = data as unknown as AppUserProfile
    await syncCategoryInterestsFromMetadata(profile.id, user)
    return profile
  }

  return createUserProfileFromAuthUser(user)
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
        await clearInvalidAuthSession()
        setSession(null)
        setProfile(null)
        setStartupError(
          'Unable to create or load your profile. Please run the profile database fix and try again.',
        )
        return
      }

      if (isInactiveProfile(userProfile)) {
        await clearInvalidAuthSession()
        setSession(null)
        setProfile(null)
        setStartupError(inactiveAccountMessage)
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

          setAppSettings(loadedSettings)

          if (!userProfile) {
            await clearInvalidAuthSession()
            if (!isMounted) return

            setSession(null)
            setProfile(null)
            setStartupError(
              'Unable to create or load your profile. Please run the profile database fix and try again.',
            )
            return
          }

          if (isInactiveProfile(userProfile)) {
            await clearInvalidAuthSession()
            if (!isMounted) return

            setSession(null)
            setProfile(null)
            setStartupError(inactiveAccountMessage)
            return
          }

          setProfile(userProfile)
          setStartupError('')
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
          <Route path="/test-packs" element={<TestPacksPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route
            path="/google-gen-ai-leader-practice-test"
            element={<GoogleGenAiLeaderPracticePage />}
          />
          <Route path="/practice/:categorySlug" element={<CategoryPracticePage />} />

          <Route path="/demo" element={<PublicDemoPage />} />
          <Route path="/demo/:demoSlug" element={<PublicDemoAttemptPage />} />

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
              <ProtectedRoute profile={profile} allowedRoles={['STUDENT']} isLoading={false}>
                <StudentDashboard profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/exams"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['STUDENT']} isLoading={false}>
                <StudentAvailableExamsPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/profile"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['STUDENT']} isLoading={false}>
                <StudentProfilePage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/exam/:examId/attempt"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['STUDENT']} isLoading={false}>
                <ExamAttemptPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/results"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['STUDENT']} isLoading={false}>
                <StudentResultsPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/results/:attemptId/review"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['STUDENT']} isLoading={false}>
                <StudentResultReviewPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['TUTOR']} isLoading={false}>
                <TutorDashboard profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor/exams"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['TUTOR']} isLoading={false}>
                <TutorExamsPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor/exam/create"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['TUTOR']} isLoading={false}>
                <CreateExamPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tutor/exam/:examId/questions"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['TUTOR']} isLoading={false}>
                <AddQuestionsPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['ADMIN']} isLoading={false}>
                <AdminDashboard profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['ADMIN']} isLoading={false}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/paid-interest"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['ADMIN']} isLoading={false}>
                <AdminPaidInterestPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['ADMIN']} isLoading={false}>
                <AdminCategoriesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/exams/pending"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['ADMIN']} isLoading={false}>
                <AdminPendingExamsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/exam/:examId/questions"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['ADMIN']} isLoading={false}>
                <AddQuestionsPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['ADMIN']} isLoading={false}>
                <AdminSettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/demo-settings"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['ADMIN']} isLoading={false}>
                <AdminDemoSettingsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ai-test-generator"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['ADMIN']} isLoading={false}>
                <AdminAiTestGeneratorPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ai-tests"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['ADMIN']} isLoading={false}>
                <AdminAiTestsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ai-tests/:testId/review"
            element={
              <ProtectedRoute profile={profile} allowedRoles={['ADMIN']} isLoading={false}>
                <AdminAiTestReviewPage profile={profile as UserProfile} />
              </ProtectedRoute>
            }
          />

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
