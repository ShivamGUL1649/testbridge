import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  Users,
} from 'lucide-react'

const examTopics = [
  'Generative AI fundamentals and foundation model concepts',
  'Business value, adoption planning, and real-world use cases',
  'Responsible AI, governance, security, privacy, and compliance',
  'Google Cloud AI and Generative AI services overview',
  'Prompting concepts, model behavior, and implementation considerations',
]

const practiceHighlights = [
  {
    title: 'Certification-style questions',
    description:
      'Practice with realistic scenario-based questions designed for learning, not memorizing dumps.',
    icon: ClipboardCheck,
  },
  {
    title: 'Instant result review',
    description:
      'Understand your score and review explanations so you can improve before the real exam.',
    icon: Trophy,
  },
  {
    title: 'AI-assisted, admin-reviewed flow',
    description:
      'TestBridge is built to support scalable test creation with admin review before publishing.',
    icon: Sparkles,
  },
]

const learningPath = [
  'Start with the free demo test to understand the question style.',
  'Review incorrect answers and note weak topics.',
  'Practice full-length topic-wise tests after registration.',
  'Repeat attempts until you are consistently above your target score.',
]

function GoogleGenAiLeaderPracticePage() {
  return (
    <main className="page-shell">
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">Google Cloud Generative AI Leader Practice Test</p>

          <h1>Prepare for the Google Gen AI Leader certification with realistic practice.</h1>

          <p className="hero-subtitle">
            TestBridge helps learners practice certification-style questions across
            generative AI fundamentals, responsible AI, business value, Google Cloud
            AI services, prompting, governance, and adoption scenarios.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" to="/demo">
              Start Free Demo
              <ArrowRight size={18} />
            </Link>

            <Link className="secondary-button" to="/register">
              Register for Full Practice
            </Link>
          </div>
        </div>

        <aside className="hero-card">
          <div className="section-title-row">
            <Brain size={24} />
            <h2>Free Demo Included</h2>
          </div>

          <p>
            Try a short no-login demo first, then register when you are ready for
            full topic-wise practice.
          </p>

          <div className="stats-grid">
            <div className="stat-card">
              <strong>10</strong>
              <span>Demo questions</span>
            </div>

            <div className="stat-card">
              <strong>15 min</strong>
              <span>Demo duration</span>
            </div>

            <div className="stat-card">
              <strong>No login</strong>
              <span>For demo</span>
            </div>
          </div>
        </aside>
      </section>

      <section className="content-grid three-column-grid">
        {practiceHighlights.map((item) => {
          const Icon = item.icon

          return (
            <article className="content-card" key={item.title}>
              <div className="feature-icon">
                <Icon size={24} />
              </div>

              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </article>
          )
        })}
      </section>

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <BookOpen size={24} />
            <h2>Topics covered</h2>
          </div>

          <p>
            The practice pack is structured around the common knowledge areas expected
            for a Generative AI Leader profile.
          </p>

          <div className="flow-list">
            {examTopics.map((topic) => (
              <div className="flow-item" key={topic}>
                <CheckCircle2 size={18} />
                <span>{topic}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <Timer size={24} />
            <h2>Suggested preparation flow</h2>
          </div>

          <div className="flow-list">
            {learningPath.map((step, index) => (
              <div className="flow-item" key={step}>
                <span className="status-pill">{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="content-card">
        <div className="section-title-row">
          <ShieldCheck size={24} />
          <h2>Original practice content only</h2>
        </div>

        <p>
          TestBridge practice questions are designed as original certification-style
          learning material. The goal is to help learners understand concepts,
          scenario thinking, and exam readiness without relying on copied or leaked
          exam questions.
        </p>
      </section>

      <section className="cta-section">
        <div>
          <p className="eyebrow">Ready to try it?</p>
          <h2>Take the free Google Gen AI Leader demo test now.</h2>
          <p>
            No login required for the demo. Register only when you want access to
            more practice tests and future paid packs.
          </p>
        </div>

        <div className="hero-actions">
          <Link className="primary-button" to="/demo">
            Start Free Demo
            <ArrowRight size={18} />
          </Link>

          <Link className="secondary-button" to="/contact">
            Contact TestBridge
          </Link>
        </div>
      </section>

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <Users size={24} />
            <h2>Who should use this?</h2>
          </div>

          <p>
            This practice path is useful for cloud learners, QA leaders, business
            technology professionals, architects, managers, and teams preparing for
            Google Cloud generative AI certification discussions.
          </p>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <Sparkles size={24} />
            <h2>What makes TestBridge different?</h2>
          </div>

          <p>
            TestBridge combines topic-wise practice, demo-first access, admin-managed
            content, and a future-ready paid-pack model so learners can start simple
            and grow into full exam preparation.
          </p>
        </article>
      </section>
    </main>
  )
}

export default GoogleGenAiLeaderPracticePage
