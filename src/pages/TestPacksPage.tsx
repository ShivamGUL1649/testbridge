import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  FileCode2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

type TestPack = {
  title: string
  description: string
  level: string
  tests: string
  status: string
  icon: React.ReactNode
}

const testPacks: TestPack[] = [
  {
    title: 'GCP Practice Tests',
    description:
      'Practice Google Cloud concepts, Gen AI topics, services, architecture basics, and certification-style scenarios.',
    level: 'Beginner to Intermediate',
    tests: 'Demo + Paid practice sets',
    status: 'Available soon',
    icon: <Cloud size={34} />,
  },
  {
    title: 'AWS Practice Tests',
    description:
      'Prepare for AWS cloud fundamentals, core services, security basics, pricing, and real-world cloud scenarios.',
    level: 'Beginner',
    tests: 'Demo + Paid practice sets',
    status: 'Available soon',
    icon: <Cloud size={34} />,
  },
  {
    title: 'Java Interview Tests',
    description:
      'Practice Java, OOP, collections, exceptions, streams, coding concepts, and common interview questions.',
    level: 'Beginner to Advanced',
    tests: 'Demo + Paid practice sets',
    status: 'Available soon',
    icon: <Code2 size={34} />,
  },
  {
    title: 'Selenium Automation Tests',
    description:
      'Prepare for Selenium WebDriver, locators, waits, frameworks, TestNG, automation design, and interview scenarios.',
    level: 'Intermediate',
    tests: 'Demo + Paid practice sets',
    status: 'Available soon',
    icon: <ShieldCheck size={34} />,
  },
  {
    title: 'Playwright Automation Tests',
    description:
      'Practice Playwright concepts, locators, assertions, browser contexts, test design, and modern automation scenarios.',
    level: 'Intermediate',
    tests: 'Demo + Paid practice sets',
    status: 'Available soon',
    icon: <FileCode2 size={34} />,
  },
  {
    title: 'SQL Practice Tests',
    description:
      'Improve SQL basics, joins, grouping, filtering, query scenarios, and database interview preparation.',
    level: 'Beginner to Intermediate',
    tests: 'Demo + Paid practice sets',
    status: 'Available soon',
    icon: <Database size={34} />,
  },
]

function TestPacksPage() {
  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Practice Test Packs</p>

          <h1>Choose a practice pack and start preparing</h1>

          <p>
            TestBridge provides focused practice tests for cloud certifications,
            QA automation, programming interviews, SQL, and technical skill
            preparation. Start with a free demo test and continue with
            affordable practice packs.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/register" className="primary-button">
            <Sparkles size={18} />
            Start Free Demo
          </Link>
        </div>
      </section>

      <section className="content-card">
        <div className="section-title-row">
          <div>
            <h2>Available and upcoming packs</h2>

            <p>
              Each pack is designed to help learners practice topic-wise,
              attempt timed tests, view instant results, and review explanations
              after submission.
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          {testPacks.map((pack) => (
            <article className="dashboard-card" key={pack.title}>
              {pack.icon}

              <h2>{pack.title}</h2>

              <p>{pack.description}</p>

              <div className="flow-list">
                <div className="flow-item">
                  <strong>Level</strong>
                  <span>{pack.level}</span>
                </div>

                <div className="flow-item">
                  <strong>Access</strong>
                  <span>{pack.tests}</span>
                </div>

                <div className="flow-item">
                  <strong>Status</strong>
                  <span>{pack.status}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Free Demo</p>

              <h2>Try before choosing a pack</h2>

              <p>
                A free demo test helps you understand the test experience,
                question format, timer, result screen, and explanation review.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <CheckCircle2 size={17} /> Attempt a sample test
              </strong>

              <span>
                Get a feel of the platform before selecting a full practice
                pack.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <CheckCircle2 size={17} /> Review your answers
              </strong>

              <span>
                Check correct answers and explanations after submitting the
                test.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <CheckCircle2 size={17} /> Decide your next pack
              </strong>

              <span>
                Choose the category that matches your certification or interview
                goal.
              </span>
            </div>
          </div>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">How to Start</p>

              <h2>Simple practice flow</h2>

              <p>
                Register, choose a test, attempt it with timer, submit your
                answers, and review your score with explanations.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>1. Create account</strong>
              <span>Register as a Test Taker.</span>
            </div>

            <div className="flow-item">
              <strong>2. Select test</strong>
              <span>Open available practice tests from your dashboard.</span>
            </div>

            <div className="flow-item">
              <strong>3. Attempt and submit</strong>
              <span>Complete the test and submit your answers.</span>
            </div>

            <div className="flow-item">
              <strong>4. Review result</strong>
              <span>Check score, correct answers, and explanations.</span>
            </div>
          </div>

          <div className="hero-actions">
            <Link to="/register" className="primary-button">
              Start Free Demo
              <ArrowRight size={18} />
            </Link>

            <Link to="/login" className="secondary-button">
              Login
            </Link>
          </div>
        </article>
      </section>

      <section className="content-card">
        <div className="alert-message alert-error create-exam-note">
          <strong>Note:</strong>
          TestBridge is an independent practice platform. Certification and
          technology names are used only to describe preparation categories.
        </div>
      </section>
    </main>
  )
}

export default TestPacksPage