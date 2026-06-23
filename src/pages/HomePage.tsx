import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileCheck2,
  FolderKanban,
  LockKeyhole,
  PlayCircle,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import SupportContact from '../components/SupportContact'

type HomeCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  page_heading: string | null
  page_subheading: string | null
  seo_description: string | null
  is_featured: boolean
  display_order: number
}

type HomeExam = {
  id: string
  category_slug: string | null
  is_demo: boolean | null
  demo_slug: string | null
}

type HomeCategoryCard = HomeCategory & {
  demoSlug: string | null
  approvedCount: number
}

function getCategoryDescription(category: HomeCategory): string {
  return (
    category.page_subheading ||
    category.seo_description ||
    category.description ||
    'Practice category-based tests with scoring, explanations, and focused preparation.'
  )
}

function HomePage() {
  const [categories, setCategories] = useState<HomeCategory[]>([])
  const [exams, setExams] = useState<HomeExam[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadHomeCategories() {
      const [categoriesResponse, examsResponse] = await Promise.all([
        supabase
          .from('exam_categories')
          .select(
            'id, name, slug, description, page_heading, page_subheading, seo_description, is_featured, display_order',
          )
          .eq('is_active', true)
          .eq('allow_public_landing', true)
          .order('is_featured', { ascending: false })
          .order('display_order', { ascending: true })
          .order('name', { ascending: true })
          .limit(6),

        supabase
          .from('exams')
          .select('id, category_slug, is_demo, demo_slug')
          .eq('status', 'APPROVED'),
      ])

      if (!isMounted) {
        return
      }

      if (categoriesResponse.error) {
        console.error(
          'Unable to load home categories:',
          categoriesResponse.error.message,
        )
        setCategories([])
      } else {
        setCategories(((categoriesResponse.data || []) as unknown) as HomeCategory[])
      }

      if (examsResponse.error) {
        console.error('Unable to load home exams:', examsResponse.error.message)
        setExams([])
      } else {
        setExams(((examsResponse.data || []) as unknown) as HomeExam[])
      }
    }

    void loadHomeCategories()

    return () => {
      isMounted = false
    }
  }, [])

  const categoryCards = useMemo<HomeCategoryCard[]>(() => {
    return categories.map((category) => {
      const categoryExams = exams.filter(
        (exam) => exam.category_slug === category.slug,
      )
      const demoExam = categoryExams.find(
        (exam) => Boolean(exam.is_demo) && Boolean(exam.demo_slug),
      )

      return {
        ...category,
        approvedCount: categoryExams.length,
        demoSlug: demoExam?.demo_slug || null,
      }
    })
  }, [categories, exams])

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">TestBridge Practice Test Platform</p>

          <h1>Practice certification-style tests before the real exam.</h1>

          <p className="hero-description">
            TestBridge helps learners attempt realistic practice tests with
            timers, scoring, answer review, and explanations. Start with a free
            demo test without login, then create an account for full practice
            access.
          </p>

          <div className="hero-actions">
            <Link to="/demo" className="primary-button">
              <Sparkles size={18} />
              Start Free Demo
            </Link>

            <Link to="/test-packs" className="secondary-button">
              View Test Packs
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-header">
            <span>Why learners use TestBridge</span>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <ClipboardCheck size={17} /> Free Demo
              </strong>
              <span>Try a short public demo test without creating an account.</span>
            </div>

            <div className="flow-item">
              <strong>
                <Clock size={17} /> Timed Practice
              </strong>
              <span>Attempt tests in an exam-like timed environment.</span>
            </div>

            <div className="flow-item">
              <strong>
                <FileCheck2 size={17} /> Instant Review
              </strong>
              <span>Check score, answers, and explanations after submission.</span>
            </div>

            <div className="flow-item">
              <strong>
                <Bot size={17} /> Admin Reviewed
              </strong>
              <span>AI-assisted tests can be reviewed before publishing.</span>
            </div>
          </div>
        </div>
      </section>

      <SupportContact
        variant="banner"
        title="Need help choosing the right practice category?"
        description="Contact TestBridge support for help with demo access, registration, test packs, or account-related questions."
      />

      <section className="stats-grid">
        <article className="stat-card">
          <span>Demo Access</span>
          <strong>No Login</strong>
        </article>

        <article className="stat-card">
          <span>Practice Mode</span>
          <strong>Timer + Score</strong>
        </article>

        <article className="stat-card">
          <span>Learning Support</span>
          <strong>Answer Review</strong>
        </article>

        <article className="stat-card">
          <span>Admin Control</span>
          <strong>Approved Tests</strong>
        </article>
      </section>

      {categoryCards.length > 0 ? (
        <section className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Featured Practice Categories</p>
              <h2>Start with an Admin-managed category.</h2>
              <p>
                These category cards are generated dynamically from Admin-created
                public categories. Each card links to its SEO landing page.
              </p>
            </div>

            <Link to="/test-packs" className="secondary-button">
              View All
              <ArrowRight size={18} />
            </Link>
          </div>

          <section className="content-grid">
            {categoryCards.map((category) => (
              <article className="exam-card" key={category.id}>
                <div className="exam-card-header">
                  <div>
                    <p className="eyebrow">
                      {category.is_featured ? 'Featured Category' : 'Practice Category'}
                    </p>

                    <h2>{category.page_heading || category.name}</h2>

                    <p>{getCategoryDescription(category)}</p>
                  </div>

                  {category.demoSlug ? (
                    <span className="status-pill status-approved">
                      <CheckCircle2 size={16} />
                      Demo
                    </span>
                  ) : (
                    <span className="status-pill">Category</span>
                  )}
                </div>

                <div className="exam-meta-grid">
                  <div>
                    <span>Approved Tests</span>
                    <strong>{category.approvedCount}</strong>
                  </div>

                  <div>
                    <span>Public Page</span>
                    <strong>/practice/{category.slug}</strong>
                  </div>
                </div>

                <div className="exam-card-actions">
                  <Link to={`/practice/${category.slug}`} className="primary-button">
                    View Category
                    <ArrowRight size={18} />
                  </Link>

                  {category.demoSlug ? (
                    <Link to={`/demo/${category.demoSlug}`} className="secondary-button">
                      <PlayCircle size={18} />
                      Demo
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        </section>
      ) : (
        <section className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Practice Categories</p>
              <h2>Public categories will appear here.</h2>
              <p>
                Ask Admin to create a category and enable public landing to show
                it on the home page.
              </p>
            </div>

            <FolderKanban size={28} />
          </div>
        </section>
      )}

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">For Learners</p>
              <h2>Build confidence before certification exams.</h2>
              <p>
                Practice topic-wise tests, understand mistakes, and improve
                readiness before attempting final certification or internal
                assessments.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Free public demo tests can be enabled per category.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Admin can add new categories like GCP, AWS, Java, Selenium, Playwright, SQL, and API testing.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Review explanations after submission to learn from each attempt.</span>
            </div>
          </div>

          <div className="hero-actions">
            <Link to="/demo" className="primary-button">
              Try Demo Test
              <ArrowRight size={18} />
            </Link>
          </div>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">For Teams</p>
              <h2>Use structured tests for learning and hiring support.</h2>
              <p>
                Admins and test creators can prepare controlled assessments for
                certification readiness, interview screening, and internal skill
                validation.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <Users size={18} />
              <span>Test creators can prepare tests for review.</span>
            </div>

            <div className="flow-item">
              <LockKeyhole size={18} />
              <span>Admin approval keeps published content controlled.</span>
            </div>

            <div className="flow-item">
              <Target size={18} />
              <span>Results help identify readiness and improvement areas.</span>
            </div>
          </div>

          <div className="hero-actions">
            <Link to="/register" className="secondary-button">
              Create Account
              <ArrowRight size={18} />
            </Link>
          </div>
        </article>
      </section>
    </main>
  )
}

export default HomePage
