import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  ClipboardList,
  HelpCircle,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import SupportContact from '../components/SupportContact'

function ContactPage() {
  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Contact TestBridge</p>
          <h1>Need help with practice tests or your account?</h1>
          <p>
            Use the support contact configured by Admin. If support contact is
            not configured yet, this page will still show general guidance.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link className="primary-button" to="/demo">
            <Sparkles size={18} />
            Start Free Demo
          </Link>

          <Link className="secondary-button" to="/test-packs">
            <ClipboardList size={18} />
            View Test Packs
          </Link>
        </div>
      </section>

      <SupportContact
        variant="banner"
        title="Contact TestBridge support"
        description="Reach out for help with demo tests, registration, category access, account login, or practice pack availability."
      />

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <HelpCircle size={22} />
            <h2>What we can help with</h2>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Demo test access and free practice questions.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Registration, login, and profile category selection.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Questions about future paid category-based test packs.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Admin, Test Creator, and Test Taker role guidance.</span>
            </div>
          </div>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <ShieldCheck size={22} />
            <h2>Support visibility rule</h2>
          </div>

          <p>
            The support email and WhatsApp number are controlled by Admin from
            Platform Settings. They appear publicly only when Admin enables
            support contact and configures at least one contact method.
          </p>

          <div className="flow-list">
            <div className="flow-item">
              <Mail size={18} />
              <span>Email appears only if Admin enters a support email.</span>
            </div>

            <div className="flow-item">
              <MessageCircle size={18} />
              <span>WhatsApp appears only if Admin enters a WhatsApp number.</span>
            </div>
          </div>
        </article>
      </section>
    </main>
  )
}

export default ContactPage
