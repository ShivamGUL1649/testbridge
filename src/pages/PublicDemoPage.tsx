import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import SupportContact from '../components/SupportContact'
import './PublicDemo.css'

type ExamCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  page_heading: string | null
  page_subheading: string | null
  is_active: boolean
  demo_enabled: boolean
  free_demo_count: number
  display_order: number
  is_featured: boolean
}

type DemoExam = {
  id: string
  title: string
  description: string | null
  total_questions: number | null
  total_time_minutes: number | null
  passing_marks: number | null
  category_id: string | null
  category_slug: string | null
  demo_slug: string | null
  is_demo: boolean | null
  status: string | null
  created_at: string
}

type CategoryWithDemos = ExamCategory & {
  demos: DemoExam[]
}

function getExamQuestionText(exam: DemoExam): string {
  const totalQuestions = exam.total_questions ?? 0

  if (totalQuestions > 0) {
    return `${totalQuestions} questions`
  }

  return 'Practice questions'
}

function getExamDurationText(exam: DemoExam): string {
  const duration = exam.total_time_minutes ?? 0

  if (duration > 0) {
    return `${duration} minutes`
  }

  return 'Timed practice'
}

function getDemoLimitText(category: ExamCategory, actualCount: number): string {
  const configuredCount = Math.max(1, category.free_demo_count || 1)

  if (actualCount === 0) {
    return `Admin configured ${configuredCount} free demo${configuredCount > 1 ? 's' : ''}`
  }

  if (actualCount < configuredCount) {
    return `${actualCount} available of ${configuredCount} configured`
  }

  return `${actualCount} free demo${actualCount > 1 ? 's' : ''} available`
}

function PublicDemoPage() {
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [demoExams, setDemoExams] = useState<DemoExam[]>([])
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('')
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const categoriesWithDemos = useMemo<CategoryWithDemos[]>(() => {
    return categories.map((category) => {
      const configuredDemoCount = Math.max(1, category.free_demo_count || 1)

      const demos = demoExams
        .filter((exam) => exam.category_slug === category.slug)
        .filter((exam) => Boolean(exam.demo_slug))
        .slice(0, configuredDemoCount)

      return {
        ...category,
        demos,
      }
    })
  }, [categories, demoExams])

  const visibleCategories = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()

    return categoriesWithDemos.filter((category) => {
      const matchesSelected =
        !selectedCategorySlug || category.slug === selectedCategorySlug

      const matchesSearch =
        !normalizedSearch ||
        category.name.toLowerCase().includes(normalizedSearch) ||
        category.slug.toLowerCase().includes(normalizedSearch) ||
        (category.description || '').toLowerCase().includes(normalizedSearch)

      return matchesSelected && matchesSearch
    })
  }, [categoriesWithDemos, searchText, selectedCategorySlug])

  const featuredCategories = useMemo(
    () => categoriesWithDemos.filter((category) => category.is_featured),
    [categoriesWithDemos],
  )

  async function loadPublicDemoData() {
    setIsLoading(true)
    setErrorMessage('')

    const { data: categoryData, error: categoryError } = await supabase
      .from('exam_categories')
      .select(
        [
          'id',
          'name',
          'slug',
          'description',
          'page_heading',
          'page_subheading',
          'is_active',
          'demo_enabled',
          'free_demo_count',
          'display_order',
          'is_featured',
        ].join(', '),
      )
      .eq('is_active', true)
      .eq('demo_enabled', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (categoryError) {
      setErrorMessage(categoryError.message)
      setCategories([])
      setDemoExams([])
      setIsLoading(false)
      return
    }

    const loadedCategories = ((categoryData || []) as unknown) as ExamCategory[]

    setCategories(loadedCategories)

    if (loadedCategories.length === 0) {
      setDemoExams([])
      setIsLoading(false)
      return
    }

    const categorySlugs = loadedCategories.map((category) => category.slug)

    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select(
        [
          'id',
          'title',
          'description',
          'total_questions',
          'total_time_minutes',
          'passing_marks',
          'category_id',
          'category_slug',
          'demo_slug',
          'is_demo',
          'status',
          'created_at',
        ].join(', '),
      )
      .eq('status', 'APPROVED')
      .eq('is_demo', true)
      .not('demo_slug', 'is', null)
      .in('category_slug', categorySlugs)
      .order('created_at', { ascending: false })

    if (examError) {
      setErrorMessage(examError.message)
      setDemoExams([])
      setIsLoading(false)
      return
    }

    setDemoExams(((examData || []) as unknown) as DemoExam[])
    setIsLoading(false)
  }

  useEffect(() => {
    void loadPublicDemoData()
  }, [])

  return (
    <main className="demo-page">
      <section className="demo-hero">
        <div className="demo-shell demo-hero-grid">
          <div className="demo-hero-copy">
            <div className="demo-pill">
              <Sparkles size={16} />
              Free demo without login
            </div>

            <h1 className="demo-title">
              Take a free certification-style demo test — no login required.
            </h1>

            <p className="demo-subtitle">
              Choose a topic, start an available demo test, review your score,
              and decide whether TestBridge is useful before registration.
            </p>

            <div className="demo-metrics">
              <div className="demo-metric">
                <strong>{categories.length}</strong>
                <span>active topics</span>
              </div>

              <div className="demo-metric">
                <strong>{demoExams.length}</strong>
                <span>free demos</span>
              </div>

              <div className="demo-metric">
                <strong>No login</strong>
                <span>required</span>
              </div>
            </div>

            <div className="demo-hero-actions">
              <a className="demo-btn-primary" href="#demo-categories">
                View Free Demos
                <ArrowRight size={18} />
              </a>

              <Link className="demo-btn-secondary" to="/register">
                Register for full access
              </Link>
            </div>
          </div>

          <aside className="demo-panel">
            <div className="section-title-row">
              <FolderKanban size={22} />
              <h2>Dynamic category model</h2>
            </div>

            <div className="demo-benefits">
              <div className="demo-benefit">
                <CheckCircle2 size={18} />
                <span>Admin creates categories from UI.</span>
              </div>

              <div className="demo-benefit">
                <CheckCircle2 size={18} />
                <span>Admin controls free demo count per category.</span>
              </div>

              <div className="demo-benefit">
                <CheckCircle2 size={18} />
                <span>Same categories support demo, registration, and paid access.</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="demo-shell">
        <SupportContact
          variant="banner"
          title="Need help before starting a demo?"
          description="Contact support for help with demo access, registration, or choosing the right practice category."
        />
      </section>

      <section className="demo-shell demo-content-section" id="demo-categories">
        <div className="demo-section-heading">
          <p className="eyebrow">Choose Topic</p>
          <h2>Available free demo tests</h2>
          <p>
            The list below is dynamic. If Admin creates, removes, or updates a
            category, it reflects here automatically.
          </p>
        </div>

        <div className="demo-filter-panel">
          <label className="demo-filter-field">
            <span>Category</span>
            <select
              value={selectedCategorySlug}
              onChange={(event) => setSelectedCategorySlug(event.target.value)}
            >
              <option value="">All demo categories</option>
              {categories.map((category) => (
                <option value={category.slug} key={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="demo-filter-field">
            <span>Search</span>
            <div className="demo-search-wrap">
              <Search size={18} />
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search AWS, Selenium, Gen AI..."
              />
            </div>
          </label>

          <button
            className="demo-btn-secondary"
            type="button"
            onClick={() => void loadPublicDemoData()}
            disabled={isLoading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>

        {errorMessage ? (
          <div className="demo-alert demo-alert-error">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {isLoading ? (
          <div className="demo-empty-state">
            <Loader2 size={24} />
            <h3>Loading demo categories...</h3>
            <p>Please wait while TestBridge loads available free demos.</p>
          </div>
        ) : visibleCategories.length === 0 ? (
          <div className="demo-empty-state">
            <FolderKanban size={24} />
            <h3>No demo category found</h3>
            <p>
              No active demo category matched your filter. Please try another
              category or check again later.
            </p>
          </div>
        ) : (
          <div className="demo-category-list">
            {visibleCategories.map((category) => (
              <article className="demo-category-card" key={category.id}>
                <div className="demo-category-header">
                  <div>
                    <div className="demo-category-badges">
                      {category.is_featured ? (
                        <span className="demo-badge">Featured</span>
                      ) : null}
                      <span className="demo-badge">
                        {getDemoLimitText(category, category.demos.length)}
                      </span>
                    </div>

                    <h3>{category.page_heading || category.name}</h3>

                    <p>
                      {category.page_subheading ||
                        category.description ||
                        'Practice this topic with free demo tests and detailed result review.'}
                    </p>
                  </div>
                </div>

                {category.demos.length === 0 ? (
                  <div className="demo-empty-mini">
                    <AlertCircle size={18} />
                    <span>
                      Demo is enabled for this category, but no approved demo
                      test is available yet.
                    </span>
                  </div>
                ) : (
                  <div className="demo-test-grid">
                    {category.demos.map((exam) => (
                      <article className="demo-test-card" key={exam.id}>
                        <div className="demo-test-card-top">
                          <h4>{exam.title}</h4>
                          <span className="demo-badge">Free</span>
                        </div>

                        <p>
                          {exam.description ||
                            `Start a free ${category.name} practice demo.`}
                        </p>

                        <div className="demo-test-meta">
                          <span>
                            <FileText size={16} />
                            {getExamQuestionText(exam)}
                          </span>

                          <span>
                            <Clock size={16} />
                            {getExamDurationText(exam)}
                          </span>
                        </div>

                        <Link
                          className="demo-btn-primary demo-test-button"
                          to={`/demo/${exam.demo_slug}`}
                        >
                          Start Demo
                          <ArrowRight size={18} />
                        </Link>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {featuredCategories.length > 0 ? (
          <div className="demo-note-card">
            <CheckCircle2 size={18} />
            <span>
              Featured categories are controlled by Admin and can be updated
              anytime from Category Master.
            </span>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default PublicDemoPage
