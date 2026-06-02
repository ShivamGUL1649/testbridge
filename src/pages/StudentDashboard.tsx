import { Link } from 'react-router-dom'
import {
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  Timer,
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
          <p className="eyebrow">Test Taker Dashboard</p>
          <h1>Welcome, {profile.name}</h1>
          <p>
            View available tests, attempt approved tests, track your scores, and
            review explanations after submission.
          </p>
        </div>
      </section>

      <section className="dashboard-grid">
        <Link to="/student/exams" className="dashboard-card">
          <ClipboardList size={34} />
          <h2>Available Tests</h2>
          <p>
            View all tests approved by admin and start your independent test
            attempt.
          </p>
        </Link>

        <Link to="/student/results" className="dashboard-card">
          <BarChart3 size={34} />
          <h2>My Results</h2>
          <p>
            Check your submitted test attempts, score percentage, and pass/fail
            status.
          </p>
        </Link>

        <div className="dashboard-card">
          <Timer size={34} />
          <h2>Timed Attempts</h2>
          <p>
            Each test has a timer. Submit before time ends or your test will be
            auto-submitted.
          </p>
        </div>

        <div className="dashboard-card">
          <BookOpenCheck size={34} />
          <h2>Review Answers</h2>
          <p>
            After submitting, review your selected answers, correct answers, and
            explanations.
          </p>
        </div>
      </section>
    </main>
  )
}

export default StudentDashboard