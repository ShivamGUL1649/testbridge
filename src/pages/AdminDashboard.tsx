import { Link } from 'react-router-dom'
import {
  ClipboardCheck,
  ShieldCheck,
  Users,
} from 'lucide-react'

import type { UserProfile } from '../types'

type AdminDashboardProps = {
  profile: UserProfile
}

function AdminDashboard({ profile }: AdminDashboardProps) {
  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Welcome, {profile.name}</h1>
          <p>
            Review tutor-published exams, approve valid exams, and reject exams
            that need correction before students can access them.
          </p>
        </div>

        <Link to="/admin/exams/pending" className="primary-button">
          <ClipboardCheck size={18} />
          Pending Approvals
        </Link>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Role</span>
          <strong>Admin</strong>
        </article>

        <article className="stat-card">
          <span>Approval Flow</span>
          <strong>Required</strong>
        </article>

        <article className="stat-card">
          <span>Student Access</span>
          <strong>Approved</strong>
        </article>
      </section>

      <section className="content-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>Admin Actions</h2>
              <p>
                Admin approval controls student visibility. Students can see
                only APPROVED exams.
              </p>
            </div>
          </div>

          <div className="exam-list">
            <article className="exam-card">
              <div className="exam-card-main">
                <div className="exam-icon">
                  <ClipboardCheck size={22} />
                </div>

                <div>
                  <div className="exam-title-row">
                    <h3>Pending Exam Approvals</h3>
                    <span className="status-pill status-pending">
                      Review
                    </span>
                  </div>

                  <p className="exam-description">
                    Approve or reject exams submitted by tutors. Approved exams
                    become visible to students.
                  </p>
                </div>
              </div>

              <div className="exam-actions">
                <Link to="/admin/exams/pending" className="primary-button">
                  <ShieldCheck size={17} />
                  Review Exams
                </Link>
              </div>
            </article>

            <article className="exam-card">
              <div className="exam-card-main">
                <div className="exam-icon">
                  <Users size={22} />
                </div>

                <div>
                  <div className="exam-title-row">
                    <h3>User Governance</h3>
                    <span className="status-pill status-draft">
                      MVP Later
                    </span>
                  </div>

                  <p className="exam-description">
                    User management, role updates, and audit views can be added
                    as a future admin enhancement.
                  </p>
                </div>
              </div>

              <div className="exam-actions">
                <button type="button" className="secondary-button" disabled>
                  Coming Soon
                </button>
              </div>
            </article>
          </div>
        </article>
      </section>
    </main>
  )
}

export default AdminDashboard