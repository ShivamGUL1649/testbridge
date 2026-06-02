import { Link } from 'react-router-dom'
import {
  ClipboardCheck,
  ClipboardList,
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
            Review tests submitted by Test Creators, approve or reject tests,
            and manage platform quality before tests are visible to Test Takers.
          </p>
        </div>
      </section>

      <section className="dashboard-grid">
        <Link to="/admin/exams/pending" className="dashboard-card">
          <ClipboardCheck size={34} />
          <h2>Manage Tests</h2>
          <p>
            Review pending, approved, rejected, and draft tests from Test
            Creators.
          </p>
        </Link>

        <div className="dashboard-card">
          <ShieldCheck size={34} />
          <h2>Approval Control</h2>
          <p>
            Only admin-approved tests become visible to Test Takers.
          </p>
        </div>

        <div className="dashboard-card">
          <ClipboardList size={34} />
          <h2>Test Quality</h2>
          <p>
            Check test details, questions, passing percentage, and readiness
            before approval.
          </p>
        </div>

        <div className="dashboard-card">
          <Users size={34} />
          <h2>User Roles</h2>
          <p>
            Test Creators create tests. Test Takers attempt approved tests.
            Admin controls publishing.
          </p>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboard