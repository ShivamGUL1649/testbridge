import { Link } from 'react-router-dom'
import {
  Award,
  BookOpen,
  ClipboardList,
  PlayCircle,
} from 'lucide-react'

import type { UserProfile } from '../types'

type StudentDashboardProps = {
  profile: UserProfile
}

function StudentDashboard({ profile }: StudentDashboardProps) {
  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Student Dashboard</p>
          <h1>Welcome, {profile.name}</h1>
          <p>
            View approved exams, start secure timed attempts, and check your
            submitted results with question-wise review.
          </p>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Role</span>
          <strong>Student</strong>
        </article>

        <article className="stat-card">
          <span>Exam Access</span>
          <strong>Approved</strong>
        </article>

        <article className="stat-card">
          <span>Attempt Mode</span>
          <strong>Timer</strong>
        </article>
      </section>

      <section className="content-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>Student Actions</h2>
              <p>
                Start with available exams. After submission, results and
                explanations will be visible from the results page.
              </p>
            </div>
          </div>

          <div className="exam-list">
            <article className="exam-card">
              <div className="exam-card-main">
                <div className="exam-icon">
                  <BookOpen size={22} />
                </div>

                <div>
                  <div className="exam-title-row">
                    <h3>Available Exams</h3>
                    <span className="status-pill status-approved">
                      <ClipboardList size={15} />
                      Approved Only
                    </span>
                  </div>

                  <p className="exam-description">
                    View all exams approved by admin and start your exam attempt.
                  </p>
                </div>
              </div>

              <div className="exam-actions">
                <Link to="/student/exams" className="primary-button">
                  <PlayCircle size={17} />
                  View Exams
                </Link>
              </div>
            </article>

            <article className="exam-card">
              <div className="exam-card-main">
                <div className="exam-icon">
                  <Award size={22} />
                </div>

                <div>
                  <div className="exam-title-row">
                    <h3>My Results</h3>
                    <span className="status-pill status-draft">
                      Review
                    </span>
                  </div>

                  <p className="exam-description">
                    Check submitted exam scores and open question-wise review.
                  </p>
                </div>
              </div>

              <div className="exam-actions">
                <Link to="/student/results" className="secondary-button">
                  <Award size={17} />
                  View Results
                </Link>
              </div>
            </article>
          </div>
        </article>
      </section>
    </main>
  )
}

export default StudentDashboard