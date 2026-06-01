import { Link } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  FilePlus2,
  Send,
} from 'lucide-react'

import type { UserProfile } from '../types'

type TutorDashboardProps = {
  profile: UserProfile
}

function TutorDashboard({ profile }: TutorDashboardProps) {
  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Tutor Dashboard</p>
          <h1>Welcome, {profile.name}</h1>
          <p>
            Create exams, add questions, publish exams for admin approval,
            and track approval status.
          </p>
        </div>

        <Link to="/tutor/exam/create" className="primary-button">
          <FilePlus2 size={18} />
          Create Exam
        </Link>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Role</span>
          <strong>Tutor</strong>
        </article>

        <article className="stat-card">
          <span>New Exams</span>
          <strong>Draft</strong>
        </article>

        <article className="stat-card">
          <span>Publish Flow</span>
          <strong>Approval</strong>
        </article>
      </section>

      <section className="content-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>Tutor Actions</h2>
              <p>
                Create exam structure first, then add questions, and finally
                publish for admin approval.
              </p>
            </div>
          </div>

          <div className="exam-list">
            <article className="exam-card">
              <div className="exam-card-main">
                <div className="exam-icon">
                  <FilePlus2 size={22} />
                </div>

                <div>
                  <div className="exam-title-row">
                    <h3>Create New Exam</h3>
                    <span className="status-pill status-draft">Draft</span>
                  </div>

                  <p className="exam-description">
                    Create exam title, description, total time, and passing
                    marks. Exam will be saved as DRAFT.
                  </p>
                </div>
              </div>

              <div className="exam-actions">
                <Link to="/tutor/exam/create" className="primary-button">
                  <FilePlus2 size={17} />
                  Create
                </Link>
              </div>
            </article>

            <article className="exam-card">
              <div className="exam-card-main">
                <div className="exam-icon">
                  <ClipboardList size={22} />
                </div>

                <div>
                  <div className="exam-title-row">
                    <h3>My Exams</h3>
                    <span className="status-pill status-pending">
                      <Send size={15} />
                      Manage
                    </span>
                  </div>

                  <p className="exam-description">
                    View draft, pending, approved, and rejected exams. Add
                    questions and publish exams for approval.
                  </p>
                </div>
              </div>

              <div className="exam-actions">
                <Link to="/tutor/exams" className="secondary-button">
                  <BookOpen size={17} />
                  View Exams
                </Link>
              </div>
            </article>
          </div>
        </article>
      </section>
    </main>
  )
}

export default TutorDashboard