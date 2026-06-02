import { Link } from 'react-router-dom'
import {
  ClipboardList,
  FilePlus2,
  Send,
  ShieldCheck,
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
          <p className="eyebrow">Test Creator Dashboard</p>
          <h1>Welcome, {profile.name}</h1>
          <p>
            Create tests, add questions, submit tests for admin approval, and
            manage your own test library.
          </p>
        </div>
      </section>

      <section className="dashboard-grid">
        <Link to="/tutor/exam/create" className="dashboard-card">
          <FilePlus2 size={34} />
          <h2>Create New Test</h2>
          <p>
            Add test details like title, description, duration, and passing
            percentage.
          </p>
        </Link>

        <Link to="/tutor/exams" className="dashboard-card">
          <ClipboardList size={34} />
          <h2>My Tests</h2>
          <p>
            View tests created by you, edit questions, publish for approval, or
            delete tests.
          </p>
        </Link>

        <div className="dashboard-card">
          <Send size={34} />
          <h2>Publish for Approval</h2>
          <p>
            Send your completed test to admin for review before it becomes
            available to test takers.
          </p>
        </div>

        <div className="dashboard-card">
          <ShieldCheck size={34} />
          <h2>Approval Workflow</h2>
          <p>
            Test takers can attempt only tests that are approved by admin.
          </p>
        </div>
      </section>
    </main>
  )
}

export default TutorDashboard