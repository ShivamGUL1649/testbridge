import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  FileText,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'

function TermsPage() {
  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Terms of Use</p>

          <h1>Use TestBridge as a practice and preparation platform.</h1>

          <p>
            These terms explain how TestBridge should be used by learners,
            trainers, and test creators. The platform is designed for practice,
            learning support, and skill preparation.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/register" className="primary-button">
            Start Free Demo
          </Link>

          <Link to="/contact" className="secondary-button">
            Contact Support
          </Link>
        </div>
      </section>

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Platform Usage</p>

              <h2>TestBridge is for practice and learning</h2>

              <p>
                TestBridge provides online practice tests to help learners
                prepare for certifications, interviews, and technical skill
                assessments. The platform should be used honestly and
                responsibly.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <BookOpenCheck size={17} /> Practice Purpose
              </strong>

              <span>
                Tests are provided to support preparation, revision, and
                self-assessment.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <UserCheck size={17} /> Responsible Use
              </strong>

              <span>
                Users should not misuse the platform, copy content without
                permission, or attempt unauthorized access.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <ShieldCheck size={17} /> Account Safety
              </strong>

              <span>
                Users are responsible for keeping their login details safe and
                secure.
              </span>
            </div>
          </div>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Important Disclaimer</p>

              <h2>No guarantee of exam success</h2>

              <p>
                TestBridge helps users practice and improve, but it does not
                guarantee that a user will pass any certification, interview, or
                official exam.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <AlertTriangle size={17} /> No Pass Guarantee
              </strong>

              <span>
                Your final result depends on your preparation, experience, and
                official exam performance.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <FileText size={17} /> Practice Content
              </strong>

              <span>
                Questions are created for practice and learning. They are not
                official exam questions.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <CheckCircle2 size={17} /> Independent Platform
              </strong>

              <span>
                TestBridge is not affiliated with Google, AWS, Microsoft, or
                any certification provider.
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="content-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">User Responsibilities</p>

            <h2>Use the platform in a fair and respectful way</h2>

            <p>
              To keep TestBridge useful for everyone, users should follow basic
              responsible usage rules.
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <UserCheck size={34} />

            <h2>Use Your Own Account</h2>

            <p>
              Do not share your account with others or use another person&apos;s
              account without permission.
            </p>
          </div>

          <div className="dashboard-card">
            <ShieldCheck size={34} />

            <h2>Do Not Misuse Content</h2>

            <p>
              Do not copy, resell, republish, or misuse questions, answers, or
              explanations from the platform.
            </p>
          </div>

          <div className="dashboard-card">
            <AlertTriangle size={34} />

            <h2>No Unauthorized Activity</h2>

            <p>
              Do not attempt to break security, access restricted pages, or
              disturb platform availability.
            </p>
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Content and Availability</p>

            <h2>Tests may change over time</h2>

            <p>
              TestBridge may update, improve, remove, or add practice tests,
              explanations, categories, and platform features over time.
            </p>
          </div>
        </div>

        <div className="alert-message alert-success create-exam-note">
          <CheckCircle2 size={18} />
          By using TestBridge, you agree to use the platform for learning,
          practice, and preparation in a responsible manner.
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

export default TermsPage