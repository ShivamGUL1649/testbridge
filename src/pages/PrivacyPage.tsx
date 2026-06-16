import { Link } from 'react-router-dom'
import {
  BookOpenCheck,
  CheckCircle2,
  Database,
  Eye,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'

function PrivacyPage() {
  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Privacy Policy</p>

          <h1>Your account, test attempts, and results should be handled responsibly.</h1>

          <p>
            This privacy policy explains what basic information TestBridge may
            collect and how it is used to provide practice tests, results, and
            learning review features.
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
              <p className="eyebrow">Information We Use</p>

              <h2>Basic account and test activity information</h2>

              <p>
                TestBridge may use basic account details and test activity data
                to provide login access, show available tests, save attempts,
                and display results.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <UserCheck size={17} /> Account Details
              </strong>

              <span>
                Name, email, and user role may be stored to manage account
                access.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <BookOpenCheck size={17} /> Test Attempts
              </strong>

              <span>
                Selected answers, score, percentage, and result information may
                be stored after test submission.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <Database size={17} /> Platform Data
              </strong>

              <span>
                Test titles, questions, answers, explanations, and attempt
                records are used to run the platform.
              </span>
            </div>
          </div>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">How It Helps You</p>

              <h2>Data is used to support your practice experience</h2>

              <p>
                Your information is used to help you login, attempt tests,
                review answers, and track your results.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <CheckCircle2 size={17} /> Show Results
              </strong>

              <span>
                Your test attempt information helps show score, percentage,
                pass/fail status, and review details.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <Eye size={17} /> Review Answers
              </strong>

              <span>
                Your submitted answers are used to compare with correct answers
                and show explanations.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <ShieldCheck size={17} /> Control Access
              </strong>

              <span>
                User roles help control access for learners, trainers, and
                admins.
              </span>
            </div>
          </div>
        </article>
      </section>

      <section className="content-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Privacy Commitments</p>

            <h2>We aim to keep the platform simple and responsible</h2>

            <p>
              TestBridge is designed as a practice platform. User data should be
              used only for platform access, test attempts, result review, and
              support.
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <LockKeyhole size={34} />

            <h2>Access Protection</h2>

            <p>
              Login and role-based access help protect learner, trainer, and
              admin areas.
            </p>
          </div>

          <div className="dashboard-card">
            <ShieldCheck size={34} />

            <h2>No Public Result Sharing</h2>

            <p>
              Test results are intended for the logged-in user and authorized
              platform access only.
            </p>
          </div>

          <div className="dashboard-card">
            <Database size={34} />

            <h2>No Selling User Data</h2>

            <p>
              TestBridge does not sell learner account data or test attempt data
              to advertisers.
            </p>
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Data Updates</p>

            <h2>Privacy policy may improve over time</h2>

            <p>
              As TestBridge grows, this privacy policy may be updated to explain
              new features, support options, payment features, or trainer plans.
            </p>
          </div>
        </div>

        <div className="alert-message alert-success create-exam-note">
          <CheckCircle2 size={18} />
          TestBridge uses basic account and test activity information to provide
          practice tests, results, and answer review.
        </div>

        <div className="alert-message alert-error create-exam-note">
          <strong>Note:</strong>
          Please do not share your password or account access with others.
        </div>
      </section>
    </main>
  )
}

export default PrivacyPage