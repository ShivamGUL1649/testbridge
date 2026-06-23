import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Filter,
  FolderKanban,
  PlayCircle,
  RefreshCcw,
  Search,
  Trophy,
  UserRoundCog,
  XCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type StudentAvailableExamsPageProps = {
  profile: UserProfile
}

type ApprovedExam = {
  id: string
  title: string
  description: string | null
  total_questions: number | null
  total_time_minutes: number
  passing_marks: number
  status: 'APPROVED'
  created_at: string
  category_id: string | null
  category_slug: string | null
  is_demo: boolean | null
  demo_slug: string | null
}

type ExamCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  display_order: number | null
  is_featured: boolean | null
}

type UserCategoryInterest = {
  category_id: string
  category_slug: string | null
  is_active: boolean
}

type ExamAttemptSummary = {
  exam_id: string
  score: number
  total_marks: number
  passed: boolean
  submitted_at: string
}

type AttemptMap = Record<
  string,
  {
    attempts: number
    latestAttempt: ExamAttemptSummary | null
  }
>

type CategoryFilter = {
  slug: string
  name: string
  count: number
}

function buildAttemptMap(attempts: ExamAttemptSummary[]): AttemptMap {
  return attempts.reduce<AttemptMap>((accumulator, attempt) => {
    const existing = accumulator[attempt.exam_id]

    if (!existing) {
      accumulator[attempt.exam_id] = {
        attempts: 1,
        latestAttempt: attempt,
      }

      return accumulator
    }

    const existingSubmittedAt = existing.latestAttempt
      ? new Date(existing.latestAttempt.submitted_at).getTime()
      : 0
    const currentSubmittedAt = new Date(attempt.submitted_at).getTime()

    accumulator[attempt.exam_id] = {
      attempts: existing.attempts + 1,
      latestAttempt:
        currentSubmittedAt >= existingSubmittedAt ? attempt : existing.latestAttempt,
    }

    return accumulator
  }, {})
}

function formatDate(value: string): string {
  if (!value) return 'Not available'

  return new Date(value).toLocaleDateString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getCategoryName(
  categorySlug: string | null,
  categories: ExamCategory[],
): string {
  if (!categorySlug) return 'General Practice'

  return (
    categories.find((category) => category.slug === categorySlug)?.name ||
    categorySlug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  )
}

function getPercentage(score: number, totalMarks: number): number {
  if (!totalMarks) return 0

  return Math.round((score / totalMarks) * 100)
}

function StudentAvailableExamsPage({ profile }: StudentAvailableExamsPageProps) {
  const [tests, setTests] = useState<ApprovedExam[]>([])
  const [allActiveCategories, setAllActiveCategories] = useState<ExamCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<ExamCategory[]>([])
  const [attemptMap, setAttemptMap] = useState<AttemptMap>({})
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadAvailableTests = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [categoriesResponse, interestsResponse, attemptsResponse] =
        await Promise.all([
          supabase
            .from('exam_categories')
            .select('id, name, slug, description, is_active, display_order, is_featured')
            .eq('is_active', true)
            .order('is_featured', { ascending: false })
            .order('display_order', { ascending: true })
            .order('name', { ascending: true }),

          supabase
            .from('user_category_interests')
            .select('category_id, category_slug, is_active')
            .eq('profile_id', profile.id)
            .eq('is_active', true),

          supabase
            .from('exam_attempts')
            .select('exam_id, score, total_marks, passed, submitted_at')
            .eq('student_id', profile.id)
            .order('submitted_at', { ascending: false }),
        ])

      if (categoriesResponse.error) {
        throw new Error(categoriesResponse.error.message)
      }

      if (interestsResponse.error) {
        throw new Error(interestsResponse.error.message)
      }

      if (attemptsResponse.error) {
        throw new Error(attemptsResponse.error.message)
      }

      const activeCategories =
        ((categoriesResponse.data ?? []) as unknown) as ExamCategory[]
      const activeInterests =
        ((interestsResponse.data ?? []) as unknown) as UserCategoryInterest[]

      const selectedCategoryIds = new Set(
        activeInterests
          .map((interest) => interest.category_id)
          .filter(Boolean),
      )

      const selectedCategorySlugsFromInterests = new Set(
        activeInterests
          .map((interest) => interest.category_slug)
          .filter(Boolean) as string[],
      )

      const allowedCategories = activeCategories.filter(
        (category) =>
          selectedCategoryIds.has(category.id) ||
          selectedCategorySlugsFromInterests.has(category.slug),
      )

      const allowedIds = new Set(allowedCategories.map((category) => category.id))
      const allowedSlugs = new Set(
        allowedCategories.map((category) => category.slug),
      )

      setAllActiveCategories(activeCategories)
      setSelectedCategories(allowedCategories)
      setAttemptMap(
        buildAttemptMap((attemptsResponse.data ?? []) as ExamAttemptSummary[]),
      )

      if (allowedCategories.length === 0) {
        setTests([])
        setSelectedCategorySlug('ALL')
        return
      }

      /*
        Important:
        Do not filter only by category_slug in Supabase query.

        Some AI-published tests may have category_id populated but category_slug
        missing or delayed due to older drafts / older publish flow. We fetch
        approved exams visible to the logged-in user, then safely filter on both
        category_id and category_slug in the frontend.

        RLS still protects student visibility on the database side.
      */
      const testsResponse = await supabase
        .from('exams')
        .select(
          [
            'id',
            'title',
            'description',
            'total_questions',
            'total_time_minutes',
            'passing_marks',
            'status',
            'created_at',
            'category_id',
            'category_slug',
            'is_demo',
            'demo_slug',
          ].join(', '),
        )
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: false })

      if (testsResponse.error) {
        throw new Error(testsResponse.error.message)
      }

      const approvedTests =
        ((testsResponse.data ?? []) as unknown) as ApprovedExam[]

      const selectedCategoryTests = approvedTests.filter(
        (test) =>
          (test.category_id && allowedIds.has(test.category_id)) ||
          (test.category_slug && allowedSlugs.has(test.category_slug)),
      )

      setTests(selectedCategoryTests)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load available tests. Please retry.'

      setErrorMessage(message)
      setTests([])
      setAllActiveCategories([])
      setSelectedCategories([])
      setAttemptMap({})
    } finally {
      setIsLoading(false)
    }
  }, [profile.id])

  useEffect(() => {
    void loadAvailableTests()
  }, [loadAvailableTests])

  const categoryFilters = useMemo<CategoryFilter[]>(() => {
    const countBySlug = tests.reduce<Record<string, number>>((accumulator, test) => {
      const slug = test.category_slug || 'general-practice'
      accumulator[slug] = (accumulator[slug] || 0) + 1
      return accumulator
    }, {})

    return selectedCategories.map((category) => ({
      slug: category.slug,
      name: category.name,
      count: countBySlug[category.slug] || 0,
    }))
  }, [selectedCategories, tests])

  const filteredTests = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase()

    return tests.filter((test) => {
      const testCategorySlug = test.category_slug || 'general-practice'
      const matchesCategory =
        selectedCategorySlug === 'ALL' || testCategorySlug === selectedCategorySlug

      const matchesSearch =
        !normalizedSearchTerm ||
        test.title.toLowerCase().includes(normalizedSearchTerm) ||
        (test.description || '').toLowerCase().includes(normalizedSearchTerm) ||
        getCategoryName(test.category_slug, selectedCategories)
          .toLowerCase()
          .includes(normalizedSearchTerm)

      return matchesCategory && matchesSearch
    })
  }, [searchTerm, selectedCategories, selectedCategorySlug, tests])

  const attemptedCount = useMemo(() => {
    return Object.keys(attemptMap).length
  }, [attemptMap])

  const hasNoSelectedCategories = !isLoading && selectedCategories.length === 0

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Available Practice Tests</p>
          <h1>Your selected category tests</h1>
          <p>
            You can see tests only from the categories selected during
            registration or updated from your profile. Add more categories from
            My Profile anytime.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/student/profile" className="secondary-button">
            <UserRoundCog size={18} />
            My Profile
          </Link>

          <Link to="/student/results" className="secondary-button">
            <Trophy size={18} />
            My Results
          </Link>

          <button
            type="button"
            className="primary-button"
            disabled={isLoading}
            onClick={() => void loadAvailableTests()}
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <div className="section-title-row">
            <ClipboardList size={22} />
            <span className="status-pill">Available</span>
          </div>

          <h2>{tests.length}</h2>

          <p>Approved tests from your selected categories.</p>
        </article>

        <article className="dashboard-card">
          <div className="section-title-row">
            <FolderKanban size={22} />
            <span className="status-pill">My Categories</span>
          </div>

          <h2>{selectedCategories.length}</h2>

          <p>
            Selected out of {allActiveCategories.length} active categories.
          </p>
        </article>

        <article className="dashboard-card">
          <div className="section-title-row">
            <Award size={22} />
            <span className="status-pill">Progress</span>
          </div>

          <h2>{attemptedCount}</h2>

          <p>Tests attempted by you so far.</p>
        </article>
      </section>

      {hasNoSelectedCategories ? (
        <section className="placeholder-card">
          <UserRoundCog size={42} />
          <h1>No category selected</h1>
          <p>
            You currently do not have any active category selected. Please choose
            at least one category from your profile to see practice tests.
          </p>

          <div className="hero-actions">
            <Link to="/student/profile" className="primary-button">
              <UserRoundCog size={18} />
              Select Categories
            </Link>
          </div>
        </section>
      ) : null}

      {!hasNoSelectedCategories ? (
        <section className="content-card">
          <div className="section-title-row">
            <div>
              <h2>Find the right test</h2>
              <p>
                Only your selected categories are available in this list. To add
                more topics, update My Profile.
              </p>
            </div>
          </div>

          <div className="create-exam-form two-column-grid">
            <label className="form-field" htmlFor="topicFilter">
              <span>My Category</span>
              <select
                id="topicFilter"
                value={selectedCategorySlug}
                onChange={(event) => setSelectedCategorySlug(event.target.value)}
              >
                <option value="ALL">All My Categories ({tests.length})</option>
                {categoryFilters.map((category) => (
                  <option value={category.slug} key={category.slug}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field" htmlFor="testSearch">
              <span>Search</span>
              <div className="input-with-icon">
                <Search size={18} />
                <input
                  id="testSearch"
                  type="search"
                  placeholder="Search by test name or category"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </label>
          </div>

          {selectedCategories.length > 0 ? (
            <div className="create-exam-note">
              <FolderKanban size={18} />
              <span>
                Your categories:{' '}
                {selectedCategories.map((category) => category.name).join(', ')}
              </span>
            </div>
          ) : null}
        </section>
      ) : null}

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      {isLoading ? (
        <section className="placeholder-card">
          <RefreshCcw size={42} className="spin-icon" />
          <h1>Loading available tests...</h1>
          <p>Please wait while we prepare your selected-category test list.</p>
        </section>
      ) : null}

      {!isLoading && !hasNoSelectedCategories && filteredTests.length === 0 ? (
        <section className="placeholder-card">
          <ClipboardList size={42} />
          <h1>No tests found</h1>
          <p>
            No approved tests are available for your selected categories or
            search keyword yet.
          </p>

          <div className="hero-actions">
            <Link to="/student/profile" className="secondary-button">
              <UserRoundCog size={18} />
              Update Categories
            </Link>
          </div>
        </section>
      ) : null}

      {!isLoading && filteredTests.length > 0 ? (
        <section className="content-grid">
          {filteredTests.map((test) => {
            const attemptSummary = attemptMap[test.id]
            const latestAttempt = attemptSummary?.latestAttempt || null
            const latestPercentage = latestAttempt
              ? getPercentage(latestAttempt.score, latestAttempt.total_marks)
              : 0
            const categoryName = getCategoryName(test.category_slug, selectedCategories)

            return (
              <article className="exam-card" key={test.id}>
                <div className="exam-card-header">
                  <div>
                    <p className="eyebrow">{categoryName}</p>

                    <h2>{test.title}</h2>

                    <p>{test.description || 'Practice this topic with timed questions.'}</p>
                  </div>

                  {latestAttempt ? (
                    <span
                      className={
                        latestAttempt.passed
                          ? 'status-pill status-approved'
                          : 'status-pill status-rejected'
                      }
                    >
                      {latestAttempt.passed ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <XCircle size={16} />
                      )}
                      {latestAttempt.passed ? 'Passed' : 'Needs Practice'}
                    </span>
                  ) : (
                    <span className="status-pill">New</span>
                  )}
                </div>

                <div className="exam-meta-grid">
                  <div>
                    <span>Questions</span>
                    <strong>
                      {test.total_questions && test.total_questions > 0
                        ? test.total_questions
                        : 'Configured'}
                    </strong>
                  </div>

                  <div>
                    <span>Duration</span>
                    <strong>{test.total_time_minutes} minutes</strong>
                  </div>

                  <div>
                    <span>Passing</span>
                    <strong>{test.passing_marks}%</strong>
                  </div>

                  <div>
                    <span>Your Latest</span>
                    <strong>
                      {latestAttempt
                        ? `${latestPercentage}% (${attemptSummary.attempts} attempt${
                            attemptSummary.attempts > 1 ? 's' : ''
                          })`
                        : 'Not attempted'}
                    </strong>
                  </div>
                </div>

                <div className="exam-card-actions">
                  <Link
                    to={`/student/exam/${test.id}/attempt`}
                    className="primary-button"
                  >
                    <PlayCircle size={18} />
                    {latestAttempt ? 'Retake Test' : 'Start Test'}
                  </Link>

                  {latestAttempt ? (
                    <Link to="/student/results" className="secondary-button">
                      <Clock3 size={18} />
                      View Result
                    </Link>
                  ) : null}
                </div>
              </article>
            )
          })}
        </section>
      ) : null}
    </main>
  )
}

export default StudentAvailableExamsPage
