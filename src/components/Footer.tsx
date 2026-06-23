import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenCheck, ShieldCheck, Sparkles } from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import SupportContact from './SupportContact'

import './Footer.css'

type FooterCategory = {
  id: string
  name: string
  slug: string
  is_featured: boolean
  display_order: number
}

const currentYear = new Date().getFullYear()

function Footer() {
  const [categories, setCategories] = useState<FooterCategory[]>([])

  useEffect(() => {
    let isMounted = true

    async function loadFooterCategories() {
      const { data, error } = await supabase
        .from('exam_categories')
        .select('id, name, slug, is_featured, display_order')
        .eq('is_active', true)
        .eq('allow_public_landing', true)
        .order('is_featured', { ascending: false })
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })
        .limit(8)

      if (!isMounted) {
        return
      }

      if (error) {
        console.error('Unable to load footer categories:', error.message)
        setCategories([])
        return
      }

      setCategories(((data || []) as unknown) as FooterCategory[])
    }

    void loadFooterCategories()

    return () => {
      isMounted = false
    }
  }, [])

  const primaryCategories = categories.slice(0, 4)
  const secondaryCategories = categories.slice(4, 8)

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <section className="site-footer__brand-block">
          <Link className="site-footer__brand" to="/" aria-label="TestBridge home">
            <span className="site-footer__brand-icon">
              <BookOpenCheck size={22} />
            </span>
            <span>TestBridge</span>
          </Link>

          <p className="site-footer__description">
            Certification-style practice tests, AI-assisted test creation, and
            skill assessment workflows for learners, teams, and test creators.
          </p>

          <div className="site-footer__badges" aria-label="TestBridge highlights">
            <span>
              <Sparkles size={15} /> AI-assisted
            </span>
            <span>
              <ShieldCheck size={15} /> Admin reviewed
            </span>
          </div>
        </section>

        <nav className="site-footer__columns" aria-label="Footer navigation">
          <section className="site-footer__column">
            <h2>Practice Categories</h2>

            {primaryCategories.length > 0 ? (
              primaryCategories.map((category) => (
                <Link to={`/practice/${category.slug}`} key={category.id}>
                  {category.name}
                </Link>
              ))
            ) : (
              <>
                <Link to="/test-packs">All Test Packs</Link>
                <Link to="/demo">Start Free Demo</Link>
              </>
            )}

            <Link to="/test-packs">All Test Packs</Link>
          </section>

          <section className="site-footer__column">
            <h2>More Categories</h2>

            {secondaryCategories.length > 0 ? (
              secondaryCategories.map((category) => (
                <Link to={`/practice/${category.slug}`} key={category.id}>
                  {category.name}
                </Link>
              ))
            ) : (
              <>
                <Link to="/demo">Start Free Demo</Link>
                <Link to="/register">Register Interest</Link>
              </>
            )}
          </section>

          <section className="site-footer__column">
            <h2>Platform</h2>
            <Link to="/about">About TestBridge</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/demo">Free Demo</Link>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </section>

          <section className="site-footer__column">
            <h2>Legal</h2>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/contact">Support</Link>
          </section>
        </nav>

        <SupportContact
          variant="compact"
          title="Need support?"
          description="Contact options appear here when configured by Admin."
        />
      </div>

      <div className="site-footer__bottom">
        <p>© {currentYear} TestBridge. All rights reserved.</p>
        <p>Original practice content. Not affiliated with certification vendors.</p>
      </div>
    </footer>
  )
}

export default Footer
