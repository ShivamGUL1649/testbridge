import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Loader2,
  PlayCircle,
  Search,
  Sparkles,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import SupportContact from '../components/SupportContact'

type ExamCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  seo_description: string | null
  page_heading: string | null
  page_subheading: string | null
  is_active: boolean
  allow_public_landing: boolean
  demo_enabled: boolean
  free_demo_count: number
  display_order: number
  is_featured: boolean
}

type PublicExam = {
  id: string
  title: string
  category_slug: string | null
  status: 'APPROVED'
  is_demo: boolean | null
  is_free_demo: boolean | null
  demo_slug: string | null
}

type CategoryCard = ExamCategory & {
  approvedCount: number
  demoCount: number
  firstDemoSlug: string | null
}

function getFallbackDescription(category: ExamCategory): string {
  return (
    category.page_subheading ||
    category.seo_description ||
    category.description ||
    'Practice category-based tests with scoring, explanations, and focused preparation.'
  )
}

function TestPacksPage() {
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [exams, setExams] = useState<PublicExam[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadTestPacks() {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [categoriesResponse, examsResponse] = await Promise.all([
        supabase
          .from('exam_categories')
          .select(
            [
              'id',
              'name',
              'slug',
              'description',
              'seo_description',
              'page_heading',
              'page_subheading',
              'is_active',
              'allow_public_landing',
              'demo_enabled',
              'free_demo_count',
              'display_order',
              'is_featured',
            ].join(', '),
          )
          .eq('is_active', true)
          .eq('allow_public_landing', true)
          .order('is_featured', { ascending: false })
          .order('display_order', { ascending: true })
          .order('name', { ascending: true }),

        supabase
          .from('exams')
          .select('id, title, category_slug, status, is_demo, is_free_demo, demo_slug')
          .eq('status', 'APPROVED'),
      ])

      if (categoriesResponse.error) {
        throw new Error(categoriesResponse.error.message)
      }

      if (examsResponse.error) {
        throw new Error(examsResponse.error.message)
      }

      setCategories(((categoriesResponse.data || []) as unknown) as ExamCategory[])
      setExams(((examsResponse.data || []) as unknown) as PublicExam[])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load TestBridge test packs.'

      setErrorMessage(message)
      setCategories([])
      setExams([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Test Packs | TestBridge'
    void loadTestPacks()
  }, [])

  const categoryCards = useMemo<CategoryCard[]>(() => {
    return categories.map((category) => {
      const categoryExams = exams.filter(
        (exam) => exam.category_slug === category.slug,
      )

      const demoExams = categoryExams.filter(
        (exam) => Boolean(exam.is_demo) && Boolean(exam.demo_slug),
      )

      return {
        ...category,
        approvedCount: categoryExams.length,
        demoCount: demoExams.length,
        firstDemoSlug: demoExams[0]?.demo_slug || null,
      }
    })
  }, [categories, exams])

  const filteredCategoryCards = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    if (!search) {
      return categoryCards
    }

    return categoryCards.filter((category) => {
      return (
        category.name.toLowerCase().includes(search) ||
        category.slug.toLowerCase().includes(search) ||
        getFallbackDescription(category).toLowerCase().includes(search)
      )
    })
  }, [categoryCards, searchTerm])

  const featuredCount = categoryCards.filter((category) => category.is_featured).length
  const totalApprovedTests = categoryCards.reduce(
    (total, category) => total + category.approvedCount,
    0,
  )
  const totalDemoTests = categoryCards.reduce(
    (total, category) => total + category.demoCount,
    0,
  )

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Test Packs</p>
          <h1>Explore TestBridge practice categories</h1>
          <p>
            Browse Admin-managed practice categories. Each category has its own
            public landing page, SEO content, demos, and registered test access.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/demo" className="secondary-button">
            <PlayCircle size={18} />
            Free Demo
          </Link>

          <Link to="/register" className="primary-button">
            Register
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <div className="section-title-row">
            <FolderKanban size={22} />
            <span className="status-pill">Categories</span>
          </div>

          <h2>{categoryCards.length}</h2>

          <p>Active public practice categories configured by Admin.</p>
        </article>

        <article className="dashboard-card">
          <div className="section-title-row">
            <ClipboardList size={22} />
            <span className="status-pill">Approved Tests</span>
          </div>

          <h2>{totalApprovedTests}</h2>

          <p>Total approved tests available across public categories.</p>
        </article>

        <article className="dashboard-card">
          <div className="section-title-row">
            <Sparkles size={22} />
            <span className="status-pill">Demos</span>
          </div>

          <h2>{totalDemoTests}</h2>

          <p>Free demo tests available for public visitors.</p>
        </article>
      </section>

      <SupportContact
        variant="banner"
        title="Need help choosing a practice pack?"
        description="Contact TestBridge support for help with categories, demo tests, registration, or future paid access."
      />

      <section className="content-card">
        <div className="section-title-row">
          <div>
            <h2>Find a practice category</h2>
            <p>
              All cards below are generated dynamically from Admin-created
              categories.
            </p>
          </div>

          <span className="status-pill">{featuredCount} featured</span>
        </div>

        <div className="create-exam-form">
          <label className="form-field" htmlFor="categorySearch">
            <span>Search Category</span>
            <div className="input-with-icon">
              <Search size={18} />
              <input
                id="categorySearch"
                type="search"
                value={searchTerm}
                placeholder="Search by category, cloud, testing, Java, SQL..."
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </label>
        </div>
      </section>

      {errorMessage ? (
        <div className="alert-message error-message">{errorMessage}</div>
      ) : null}

      {isLoading ? (
        <section className="placeholder-card">
          <Loader2 size={42} className="spin-icon" />
          <h1>Loading test packs...</h1>
          <p>Please wait while TestBridge loads active public categories.</p>
        </section>
      ) : null}

      {!isLoading && filteredCategoryCards.length === 0 ? (
        <section className="placeholder-card">
          <BookOpenCheck size={42} />
          <h1>No test pack found</h1>
          <p>
            No active public category matches your search. Try another keyword
            or ask Admin to enable public landing for the category.
          </p>
        </section>
      ) : null}

      {!isLoading && filteredCategoryCards.length > 0 ? (
        <section className="content-grid">
          {filteredCategoryCards.map((category) => (
            <article className="exam-card" key={category.id}>
              <div className="exam-card-header">
                <div>
                  <p className="eyebrow">
                    {category.is_featured ? 'Featured Category' : 'Practice Category'}
                  </p>

                  <h2>{category.page_heading || category.name}</h2>

                  <p>{getFallbackDescription(category)}</p>
                </div>

                {category.demoCount > 0 ? (
                  <span className="status-pill status-approved">
                    <CheckCircle2 size={16} />
                    Demo Available
                  </span>
                ) : (
                  <span className="status-pill">Coming Soon</span>
                )}
              </div>

              <div className="exam-meta-grid">
                <div>
                  <span>Approved Tests</span>
                  <strong>{category.approvedCount}</strong>
                </div>

                <div>
                  <span>Free Demos</span>
                  <strong>{category.demoCount}</strong>
                </div>

                <div>
                  <span>Public URL</span>
                  <strong>/practice/{category.slug}</strong>
                </div>

                <div>
                  <span>Access</span>
                  <strong>Profile Category</strong>
                </div>
              </div>

              <div className="exam-card-actions">
                <Link
                  to={`/practice/${category.slug}`}
                  className="primary-button"
                >
                  View Landing Page
                  <ArrowRight size={18} />
                </Link>

                {category.firstDemoSlug ? (
                  <Link
                    to={`/demo/${category.firstDemoSlug}`}
                    className="secondary-button"
                  >
                    <PlayCircle size={18} />
                    Start Demo
                  </Link>
                ) : (
                  <Link to="/register" className="secondary-button">
                    Register Interest
                  </Link>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}

export default TestPacksPage
