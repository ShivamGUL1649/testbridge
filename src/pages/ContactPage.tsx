import { Link } from 'react-router-dom'
import {
  BookOpenCheck,
  CheckCircle2,
  HelpCircle,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Users,
} from 'lucide-react'

function ContactPage() {
  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Contact TestBridge</p>

          <h1>Need help with practice tests, access, or trainer setup?</h1>

          <p>
            Contact the TestBridge team for support related to test access,
            practice packs, trainer usage, or platform questions.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/register" className="primary-button">
            Start Free Demo
          </Link>

          <Link to="/test-packs" className="secondary-button">
            View Test Packs
          </Link>
        </div>
      </section>

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">For Learners</p>

              <h2>Get support for your preparation</h2>

              <p>
                If you are preparing for certifications, interviews, or
                technical skill assessments, you can contact us for help with
                available tests, demo access, and practice pack details.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <BookOpenCheck size={17} /> Test Access
              </strong>

              <span>
                Ask about available practice tests, demo tests, and upcoming
                categories.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <HelpCircle size={17} /> Result Help
              </strong>

              <span>
                Get help understanding the test flow, result screen, and answer
                review.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <CheckCircle2 size={17} /> Practice Guidance
              </strong>

              <span>
                Get guidance on which practice pack may be suitable for your
                learning goal.
              </span>
            </div>
          </div>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">For Trainers</p>

              <h2>Use TestBridge for your learners</h2>

              <p>
                Trainers, test creators, and small teams can use TestBridge to
                create structured tests, publish approved tests, and support
                learners with practice assessments.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <Users size={17} /> Trainer Setup
              </strong>

              <span>
                Ask how to create tests and share practice assessments with
                learners.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <ShieldCheck size={17} /> Test Review
              </strong>

              <span>
                Understand the approval process before tests become available to
                learners.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <MessageSquareText size={17} /> Custom Requirement
              </strong>

              <span>
                Discuss custom test packs for a course, batch, interview, or
                internal assessment.
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="content-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Contact Options</p>

            <h2>Reach out for support or collaboration</h2>

            <p>
              You can contact us for learner support, trainer onboarding,
              practice pack details, or business collaboration.
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <Mail size={34} />

            <h2>Email Support</h2>

            <p>
              Contact the TestBridge admin for access, support, and practice
              pack related queries.
            </p>
          </div>

          <div className="dashboard-card">
            <Users size={34} />

            <h2>Trainer Inquiry</h2>

            <p>
              Trainers can connect to discuss learner batches, custom tests, and
              practice assessment setup.
            </p>
          </div>

          <div className="dashboard-card">
            <BookOpenCheck size={34} />

            <h2>Test Pack Request</h2>

            <p>
              Request new categories such as Azure, Python, DevOps, Agile, or
              advanced QA automation.
            </p>
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="alert-message alert-success create-exam-note">
          <Mail size={18} />
          Contact form and direct email support can be added in the next phase.
          For now, users can register and start with available demo tests.
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

export default ContactPage