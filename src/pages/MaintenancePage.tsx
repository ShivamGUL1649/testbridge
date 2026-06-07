import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Lock,
} from 'lucide-react'

type MaintenancePageProps = {
  message: string
  showLoginButton?: boolean
}

function MaintenancePage({
  message,
  showLoginButton = true,
}: MaintenancePageProps) {
  return (
    <main className="page-shell">
      <section className="placeholder-card error-card">
        <AlertTriangle size={46} />

        <p className="eyebrow">Platform Maintenance</p>

        <h1>TestBridge is temporarily unavailable</h1>

        <p>
          {message ||
            'TestBridge is currently under maintenance. Please try again later.'}
        </p>

        {showLoginButton ? (
          <div className="hero-actions">
            <Link to="/login" className="primary-button">
              <Lock size={18} />
              Admin Login
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  )
}

export default MaintenancePage