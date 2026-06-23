import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  FileQuestion,
  FolderKanban,
  Loader2,
  PlayCircle,
  Search,
  Sparkles,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import SupportContact from '../components/SupportContact'

import './CategoryPracticePage.css'

type ExamCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  page_heading: string | null
  page_subheading: string | null
  page_content: string | null
  demo_enabled: boolean
  free_demo_count: number
  allow_public_landing: boolean
  is_featured: boolean
}

type PublicExam = {
  id: string
  title: string
  description: string | null
  total_questions: number | null
  total_time_minutes: number | null
  passing_marks: number | null
  is_demo: boolean | null
  is_free_demo: boolean | null
  demo_slug: string | null
  free_demo_order: number | null
  created_at: string
}

function setMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null

  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }

  tag.setAttribute('content', content)
}

function formatCategoryFallbackTitle(slug: string | undefined): string {
  if (!slug) return 'Practice Tests'

  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function CategoryPracticePage() {
  const { categorySlug } = useParams()
  const [category, setCategory] = useState<ExamCategory | null>(null)
  const [exams, setExams] = useState<PublicExam[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadCategoryPage() {
      setIsLoading(true)
      setErrorMessage('')

      if (!categorySlug) {
        setErrorMessage('Category was not found.')
        setIsLoading(false)
        return
      }

      const { data: categoryData, error: categoryError } = await supabase
        .from('exam_categories')
        .select(
          [
            'id',
            'name',
            'slug',
            'description',
            'seo_title',
            'seo_description',
            'seo_keywords',
            'page_heading',
            'page_subheading',
            'page_content',
            'demo_enabled',
            'free_demo_count',
            'allow_public_landing',
            'is_featured',
          ].join(', '),
        )
        .eq('slug', categorySlug)
        .eq('is_active', true)
        .eq('allow_public_landing', true)
        .maybeSingle()

      if (!isMounted) return

      if (categoryError) {
        setErrorMessage(categoryError.message)
        setCategory(null)
        setExams([])
        setIsLoading(false)
        return
      }

      if (!categoryData) {
        setCategory(null)
        setExams([])
        setIsLoading(false)
        return
      }

      const loadedCategory = categoryData as unknown as ExamCategory
      setCategory(loadedCategory)

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
            'is_demo',
            'is_free_demo',
            'demo_slug',
            'free_demo_order',
            'created_at',
          ].join(', '),
        )
        .eq('status', 'APPROVED')
        .eq('category_slug', loadedCategory.slug)
        .order('is_demo', { ascending: false })
        .order('free_demo_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (!isMounted) return

      if (examError) {
        setErrorMessage(examError.message)
        setExams([])
        setIsLoading(false)
        return
      }

      setExams(((examData || []) as unknown) as PublicExam[])
      setIsLoading(false)
    }

    void loadCategoryPage()

    return () => {
      isMounted = false
    }
  }, [categorySlug])

  useEffect(() => {
    if (!category) return

    const title = category.seo_title || `${category.name} Practice Tests | TestBridge`
    const description =
      category.seo_description ||
      category.description ||
      `Practice ${category.name} questions with TestBridge.`

    document.title = title
    setMetaTag('description', description)

    if (category.seo_keywords) {
      setMetaTag('keywords', category.seo_keywords)
    }
  }, [category])

  const demoExams = useMemo(() => {
    if (!category) return []

    return exams
      .filter((exam) => exam.is_demo && exam.demo_slug)
      .slice(0, Math.max(category.free_demo_count || 1, 0))
  }, [category, exams])

  const filteredExams = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()

    if (!search) {
      return exams
    }

    return exams.filter((exam) => {
      return (
        exam.title.toLowerCase().includes(search) ||
        (exam.description || '').toLowerCase().includes(search)
      )
    })
  }, [exams, searchTerm])

  const heading =
    category?.page_heading ||
    category?.name ||
    `${formatCategoryFallbackTitle(categorySlug)} Practice Tests`

  const subheading =
    category?.page_subheading ||
    category?.description ||
    'Practice certification-style questions with scoring, explanations, and focused preparation.'

  if (isLoading) {
    return (
      <main className="category-practice-page">
        <section className="category-practice-shell">
          <div className="category-practice-loading">
            <Loader2 size={38} />
            <h1>Loading practice category...</h1>
            <p>Please wait while TestBridge prepares this category page.</p>
          </div>
        </section>
      </main>
    )
  }

  if (!category) {
    return (
      <main className="category-practice-page">
        <section className="category-practice-shell">
          <div className="category-practice-empty">
            <FolderKanban size={42} />
            <h1>Category not found</h1>
            <p>
              This category may be inactive, unpublished, or not available for
              public landing pages.
            </p>

            <div className="category-practice-actions">
              <Link to="/test-packs" className="category-practice-primary-link">
                View Test Packs
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="category-practice-page">
      <section className="category-practice-hero">
        <div className="category-practice-shell category-practice-hero-grid">
          <div>
            <p className="category-practice-eyebrow">
              {category.is_featured ? 'Featured Practice Category' : 'Practice Category'}
            </p>

            <h1>{heading}</h1>

            <p>{subheading}</p>

            <div className="category-practice-actions">
              {demoExams.length > 0 ? (
                <Link
                  to={`/demo/${demoExams[0].demo_slug}`}
                  className="category-practice-primary-link"
                >
                  <PlayCircle size={18} />
                  Start Free Demo
                </Link>
              ) : (
                <Link to="/demo" className="category-practice-primary-link">
                  <PlayCircle size={18} />
                  View Free Demos
                </Link>
              )}

              <Link to="/register" className="category-practice-secondary-link">
                Register for More Tests
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <aside className="category-practice-hero-card">
            <Sparkles size={30} />
            <h2>{category.name}</h2>

            <div className="category-practice-stat-grid">
              <div>
                <strong>{exams.length}</strong>
                <span>Approved Tests</span>
              </div>

              <div>
                <strong>{demoExams.length}</strong>
                <span>Free Demos</span>
              </div>
            </div>

            <p>
              Create a TestBridge account and select this category in your
              profile to see matching practice tests after login.
            </p>
          </aside>
        </div>
      </section>

      <section className="category-practice-shell">
        <SupportContact
          variant="banner"
          title={`Need help with ${category.name}?`}
          description="Contact TestBridge support for help with demos, registration, category access, or practice pack information."
        />

        {category.page_content ? (
          <article className="category-practice-content-card">
            <BookOpenCheck size={24} />
            <div>
              <h2>About this practice category</h2>
              <p>{category.page_content}</p>
            </div>
          </article>
        ) : null}

        <section className="category-practice-section-heading">
          <div>
            <p className="category-practice-eyebrow">Available Tests</p>
            <h2>Practice tests in this category</h2>
          </div>

          <label className="category-practice-search">
            <Search size={18} />
            <input
              type="search"
              value={searchTerm}
              placeholder="Search tests..."
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </section>

        {errorMessage ? (
          <div className="category-practice-alert">{errorMessage}</div>
        ) : null}

        {filteredExams.length === 0 ? (
          <section className="category-practice-empty">
            <FileQuestion size={42} />
            <h1>No approved test available yet</h1>
            <p>
              This category is ready for SEO and marketing, but no approved test
              currently matches this search.
            </p>
          </section>
        ) : (
          <section className="category-practice-test-grid">
            {filteredExams.map((exam) => (
              <article className="category-practice-test-card" key={exam.id}>
                <div className="category-practice-test-card-header">
                  <ClipboardList size={22} />

                  {exam.is_demo && exam.demo_slug ? (
                    <span>Free Demo</span>
                  ) : (
                    <span>Registered Access</span>
                  )}
                </div>

                <h3>{exam.title}</h3>

                <p>{exam.description || 'Practice this topic with TestBridge.'}</p>

                <div className="category-practice-meta">
                  <div>
                    <strong>{exam.total_questions || '—'}</strong>
                    <span>Questions</span>
                  </div>

                  <div>
                    <strong>{exam.total_time_minutes || '—'}</strong>
                    <span>Minutes</span>
                  </div>

                  <div>
                    <strong>{exam.passing_marks || '—'}%</strong>
                    <span>Passing</span>
                  </div>
                </div>

                <div className="category-practice-test-actions">
                  {exam.is_demo && exam.demo_slug ? (
                    <Link
                      to={`/demo/${exam.demo_slug}`}
                      className="category-practice-primary-link"
                    >
                      <PlayCircle size={18} />
                      Start Demo
                    </Link>
                  ) : (
                    <Link to="/register" className="category-practice-secondary-link">
                      <CheckCircle2 size={18} />
                      Register to Access
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  )
}

export default CategoryPracticePage
