import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

import './Footer.css'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer-content">
        <div className="site-footer-brand">
          <div className="site-footer-logo">
            <ShieldCheck size={22} />

            <span>TestBridge</span>
          </div>

          <p>
            Practice for certifications, interviews, and technical skills with
            online tests, instant results, and explanations.
          </p>
        </div>

        <div className="site-footer-links">
          <div>
            <h3>Platform</h3>

            <Link to="/">Home</Link>
            <Link to="/test-packs">Test Packs</Link>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div>
            <h3>Practice Categories</h3>

            <span>GCP Practice Tests</span>
            <span>AWS Practice Tests</span>
            <span>Java Interview Tests</span>
            <span>QA Automation Tests</span>
            <span>SQL Practice Tests</span>
          </div>

          <div>
            <h3>Legal</h3>

            <Link to="/terms">Terms of Use</Link>
            <Link to="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>

      <div className="site-footer-bottom">
        <p>© {currentYear} TestBridge. All rights reserved.</p>

        <p>
          TestBridge is an independent practice platform. Certification and
          technology names are used only to describe preparation categories.
        </p>
      </div>
    </footer>
  )
}

export default Footer