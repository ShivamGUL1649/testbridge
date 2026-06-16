import { Link } from 'react-router-dom'
import {
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react'

function AboutPage() {
  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">About TestBridge</p>

          <h1>Helping learners practice, review, and improve with confidence.</h1>

          <p>
            TestBridge is an online practice test platform built for learners,
            trainers, and test creators who want a simple way to prepare for
            certifications, interviews, and technical skill assessments.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/test-packs" className="primary-button">
            View Test Packs
          </Link>
        </div>
      </section>

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Our Purpose</p>

              <h2>Practice should be simple and useful</h2>

              <p>
                Many learners prepare for interviews and certifications but do
                not get enough structured practice. TestBridge helps learners
                attempt timed tests, check their score, and understand mistakes
                through explanations.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <Target size={17} /> Focused Practice
              </strong>

              <span>
                Practice topic-wise tests for cloud, QA automation, programming,
                SQL, and interview preparation.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <BookOpenCheck size={17} /> Result Review
              </strong>

              <span>
                Review correct answers and explanations after test submission.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <GraduationCap size={17} /> Better Preparation
              </strong>

              <span>
                Improve confidence before certifications, interviews, and skill
                assessments.
              </span>
            </div>
          </div>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Who can use it?</p>

              <h2>Built for learners and trainers</h2>

              <p>
                TestBridge can be used by individual learners, trainers,
                institutes, and teams who want to conduct practice tests or
                evaluate preparation.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <Users size={17} /> Learners
              </strong>

              <span>
                Attempt practice tests and review results with explanations.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <ShieldCheck size={17} /> Trainers
              </strong>

              <span>
                Create structured tests and share approved tests with learners.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <CheckCircle2 size={17} /> Admins
              </strong>

              <span>
                Review test quality and publish tests for learner access.
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="content-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Quality Approach</p>

            <h2>Reviewed tests with explanations</h2>

            <p>
              The goal of TestBridge is not only to show questions. The goal is
              to help learners understand why an answer is correct and where
              they need more practice.
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <CheckCircle2 size={34} />

            <h2>Reviewed Before Publishing</h2>

            <p>
              Tests are checked before they are made available to learners.
            </p>
          </div>

          <div className="dashboard-card">
            <BookOpenCheck size={34} />

            <h2>Explanations Included</h2>

            <p>
              Learners can review explanations after submitting their test.
            </p>
          </div>

          <div className="dashboard-card">
            <Target size={34} />

            <h2>Practice-Focused</h2>

            <p>
              The platform is designed to support preparation, revision, and
              confidence building.
            </p>
          </div>
        </div>
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

export default AboutPage