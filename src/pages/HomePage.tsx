import { Link } from 'react-router-dom'
import {
  Award,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Cloud,
  Code2,
  Database,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react'

function HomePage() {
  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">TestBridge Practice Platform</p>

          <h1>
            Practice for certifications and interviews with online tests,
            instant results, and explanations.
          </h1>

          <p className="hero-description">
            TestBridge helps you prepare for cloud certifications, QA
            automation, programming interviews, SQL, and technical assessments
            through structured practice tests.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="primary-button">
              Start Free Demo
            </Link>

            <Link to="/login" className="secondary-button">
              Login
            </Link>
          </div>

          <div className="trust-points">
            <span>
              <CheckCircle2 size={16} />
              Timed practice tests
            </span>

            <span>
              <CheckCircle2 size={16} />
              Instant score
            </span>

            <span>
              <CheckCircle2 size={16} />
              Answer explanations
            </span>
          </div>
        </div>

        <div className="hero-card">
          <div className="hero-card-header">
            <span>How TestBridge Helps You</span>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <BookOpenCheck size={17} /> Choose a Test
              </strong>
              <span>
                Select a practice test from certification, interview, or skill
                categories.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <Clock size={17} /> Attempt with Timer
              </strong>
              <span>
                Practice in a real test-like environment with time limits.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <Target size={17} /> Check Your Score
              </strong>
              <span>
                Get your score, percentage, and pass/fail result instantly.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <FileCheck2 size={17} /> Review Explanations
              </strong>
              <span>
                Understand correct answers and improve your weak areas.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-card home-section-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Practice Categories</p>

            <h2>Prepare for the skills that matter</h2>

            <p>
              Start with focused practice sets for cloud, QA automation,
              programming, SQL, and technical interview preparation.
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <Cloud size={34} />

            <h2>GCP Practice Tests</h2>

            <p>
              Practice Google Cloud and Gen AI certification-style concepts with
              structured MCQ tests.
            </p>
          </div>

          <div className="dashboard-card">
            <Cloud size={34} />

            <h2>AWS Practice Tests</h2>

            <p>
              Prepare for AWS cloud fundamentals, services, scenarios, and
              certification-style questions.
            </p>
          </div>

          <div className="dashboard-card">
            <Code2 size={34} />

            <h2>Java Interview Tests</h2>

            <p>
              Practice Java, OOP, collections, exceptions, streams, and common
              interview scenarios.
            </p>
          </div>

          <div className="dashboard-card">
            <ShieldCheck size={34} />

            <h2>QA Automation Tests</h2>

            <p>
              Prepare for Selenium, Playwright, API testing, manual testing, and
              automation interviews.
            </p>
          </div>

          <div className="dashboard-card">
            <Database size={34} />

            <h2>SQL Practice Tests</h2>

            <p>
              Improve SQL basics, joins, queries, database scenarios, and
              interview readiness.
            </p>
          </div>

          <div className="dashboard-card">
            <GraduationCap size={34} />

            <h2>More Tests Coming</h2>

            <p>
              Azure, Python, DevOps, Agile, Scrum, and advanced technical packs
              will be added gradually.
            </p>
          </div>
        </div>
      </section>

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">For Learners</p>

              <h2>Practice, review, and improve</h2>

              <p>
                TestBridge is useful when you want to check your preparation
                level before interviews, certifications, or internal skill
                assessments.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>Attempt practice tests</strong>

              <span>
                Select available tests and complete them in a timed environment.
              </span>
            </div>

            <div className="flow-item">
              <strong>Get instant result</strong>

              <span>
                View your score, percentage, and pass/fail status immediately.
              </span>
            </div>

            <div className="flow-item">
              <strong>Review correct answers</strong>

              <span>
                Understand your mistakes with correct answers and explanations.
              </span>
            </div>

            <div className="flow-item">
              <strong>Improve weak areas</strong>

              <span>
                Use result review to identify topics where more practice is
                needed.
              </span>
            </div>
          </div>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">For Trainers</p>

              <h2>Create tests for your learners</h2>

              <p>
                Trainers and test creators can build practice tests, add
                questions, define passing percentage, and share approved tests
                with learners.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>Create structured tests</strong>

              <span>
                Add test title, duration, passing percentage, and description.
              </span>
            </div>

            <div className="flow-item">
              <strong>Add questions and answers</strong>

              <span>
                Add MCQs with options, correct answers, marks, and
                explanations.
              </span>
            </div>

            <div className="flow-item">
              <strong>Publish after review</strong>

              <span>
                Tests become available to learners only after approval.
              </span>
            </div>

            <div className="flow-item">
              <strong>Support practice at scale</strong>

              <span>
                Use the platform for batches, learners, and repeated practice.
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="content-card home-section-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Why choose TestBridge?</p>

            <h2>Simple practice experience with clear learning value</h2>

            <p>
              The goal is simple: help learners practice more, understand their
              mistakes, and become more confident before interviews or exams.
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <CheckCircle2 size={34} />

            <h2>Reviewed Tests</h2>

            <p>
              Tests are prepared and reviewed before they are made available to
              learners.
            </p>
          </div>

          <div className="dashboard-card">
            <Award size={34} />

            <h2>Result Review</h2>

            <p>
              Learners can review correct answers and explanations after
              submitting the test.
            </p>
          </div>

          <div className="dashboard-card">
            <Users size={34} />

            <h2>Useful for Learners and Trainers</h2>

            <p>
              Individuals can practice, and trainers can use the platform to
              assess learners.
            </p>
          </div>
        </div>

        <div className="alert-message alert-success create-exam-note">
          <CheckCircle2 size={18} />
          Start with a free demo test and explore practice packs based on your
          learning goal.
        </div>

        <div className="alert-message alert-error create-exam-note">
          <strong>Note:</strong>
          TestBridge is an independent practice platform. Certification and
          technology names are used only to describe preparation categories.
        </div>
      </section>
    </main>
  )
}

export default HomePage