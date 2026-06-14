import { Link } from 'react-router-dom'
import {
  Bot,
  ClipboardCheck,
  ClipboardList,
  Database,
  Settings,
  ShieldCheck,
  Sparkles,
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
            Review tests from Test Creators, generate AI tests, review
            Firestore draft tests, manage publishing, and control platform
            settings.
          </p>
        </div>
      </section>

      <section className="dashboard-grid">
        <Link to="/admin/ai-test-generator" className="dashboard-card">
          <Sparkles size={34} />
          <h2>Create Test with AI</h2>
          <p>
            Generate a complete test using GCP Cloud Run and OpenAI. Generated
            questions are saved in Firestore as Draft.
          </p>
        </Link>

        <Link to="/admin/ai-tests" className="dashboard-card">
          <Database size={34} />
          <h2>AI Generated Tests</h2>
          <p>
            View and review AI-generated Firestore tests before publishing them
            for Test Takers.
          </p>
        </Link>

        <Link to="/admin/exams/pending" className="dashboard-card">
          <ClipboardCheck size={34} />
          <h2>Manage Published Tests</h2>
          <p>
            Review pending, approved, rejected, and draft tests from Test
            Creators in the existing Supabase test system.
          </p>
        </Link>

        <Link to="/admin/settings" className="dashboard-card">
          <Settings size={34} />
          <h2>Admin Settings</h2>
          <p>
            Control platform-level settings such as maintenance mode and system
            availability.
          </p>
        </Link>

        <div className="dashboard-card">
          <ShieldCheck size={34} />
          <h2>Approval Control</h2>
          <p>
            Only admin-approved tests become visible to Test Takers in the final
            published test area.
          </p>
        </div>

        <div className="dashboard-card">
          <ClipboardList size={34} />
          <h2>Test Quality</h2>
          <p>
            Check test details, questions, correct answers, passing percentage,
            and explanations before publishing.
          </p>
        </div>

        <div className="dashboard-card">
          <Bot size={34} />
          <h2>AI Draft Area</h2>
          <p>
            Firestore is currently used as the AI draft and review area. Final
            published tests still remain in Supabase.
          </p>
        </div>

        <div className="dashboard-card">
          <Users size={34} />
          <h2>User Roles</h2>
          <p>
            Test Creators create manual tests. Test Takers attempt approved
            tests. Admin controls AI generation and publishing.
          </p>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboard