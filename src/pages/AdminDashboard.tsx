import type { ElementType } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FolderKanban,
  MonitorPlay,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
  WalletCards,
} from 'lucide-react'

import type { UserProfile } from '../types'

type AdminDashboardProps = {
  profile: UserProfile
}

type AdminCard = {
  title: string
  description: string
  link: string
  buttonText: string
  icon: ElementType
  badge: string
}

const adminCards: AdminCard[] = [
  {
    title: 'Category Master',
    description:
      'Create, edit, remove, restore, and SEO-configure dynamic test categories.',
    link: '/admin/categories',
    buttonText: 'Manage Categories',
    icon: FolderKanban,
    badge: 'Core Setup',
  },
  {
    title: 'Create Test by AI',
    description:
      'Generate high-quality draft tests using AI and review them before publishing.',
    link: '/admin/ai-test-generator',
    buttonText: 'Generate Test',
    icon: Sparkles,
    badge: 'AI',
  },
  {
    title: 'AI Draft Tests',
    description:
      'Review, improve, approve, and publish AI-generated tests from the draft area.',
    link: '/admin/ai-tests',
    buttonText: 'Review Drafts',
    icon: Bot,
    badge: 'Review',
  },
  {
    title: 'Demo Settings',
    description:
      'Choose public demo tests, question limits, duration, and register CTA visibility.',
    link: '/admin/demo-settings',
    buttonText: 'Configure Demo',
    icon: MonitorPlay,
    badge: 'Public Demo',
  },
  {
    title: 'Registered Users',
    description:
      'View all registered users, roles, status, and category-access preparation data.',
    link: '/admin/users',
    buttonText: 'View Users',
    icon: UserRoundCheck,
    badge: 'Users',
  },
  {
    title: 'Paid Pack Interest',
    description:
      'Track users who are interested in future paid category-based practice packs.',
    link: '/admin/paid-interest',
    buttonText: 'View Leads',
    icon: WalletCards,
    badge: 'Leads',
  },
  {
    title: 'Pending Approvals',
    description:
      'Approve or reject tests submitted by Test Creators before users can attempt them.',
    link: '/admin/exams/pending',
    buttonText: 'Review Tests',
    icon: FileCheck2,
    badge: 'Approval',
  },
  {
    title: 'Platform Settings',
    description:
      'Control maintenance mode, support email, WhatsApp number, and platform settings.',
    link: '/admin/settings',
    buttonText: 'Open Settings',
    icon: Settings,
    badge: 'Control',
  },
]

function getDisplayName(profile: UserProfile): string {
  return profile.name || profile.email || 'Admin'
}

function AdminDashboard({ profile }: AdminDashboardProps) {
  const displayName = getDisplayName(profile)

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>Welcome, {displayName}</h1>
          <p>
            Manage TestBridge categories, AI-generated tests, public demos,
            registered users, paid-interest leads, and platform settings from
            one central place.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link className="secondary-button" to="/admin/categories">
            Category Master
          </Link>

          <Link className="primary-button" to="/admin/ai-test-generator">
            Create Test by AI
          </Link>
        </div>
      </section>

      <section className="dashboard-grid">
        {adminCards.map((card) => {
          const Icon = card.icon

          return (
            <article className="dashboard-card" key={card.title}>
              <div className="section-title-row">
                <span className="feature-icon">
                  <Icon size={22} />
                </span>

                <span className="status-pill">{card.badge}</span>
              </div>

              <h2>{card.title}</h2>

              <p>{card.description}</p>

              <Link className="primary-button" to={card.link}>
                {card.buttonText}
              </Link>
            </article>
          )
        })}
      </section>

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <ShieldCheck size={22} />
            <h2>Dynamic Category Flow</h2>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Admin creates SEO-friendly categories once.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Same category list appears in demo, registration, and test creation.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Admin controls free demo count per category.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Inactive categories are removed from public UI without breaking old data.</span>
            </div>
          </div>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <ClipboardList size={22} />
            <h2>Current Implementation Focus</h2>
          </div>

          <p>
            We are making categories the single source of truth across the
            product. This will support future paid category access, topic-wise
            demos, SEO landing pages, and cleaner Admin control.
          </p>

          <div className="create-exam-note">
            <Users size={18} />
            <span>
              Next: connect the dynamic category list into manual test creation
              and AI test generation.
            </span>
          </div>
        </article>
      </section>
    </main>
  )
}

export default AdminDashboard
