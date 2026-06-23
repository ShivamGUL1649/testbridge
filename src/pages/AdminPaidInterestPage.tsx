import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  ClipboardList,
  Filter,
  Mail,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'

type PaidInterestLead = {
  id: string
  user_id: string | null
  name: string | null
  email: string | null
  category_id: string | null
  category_slug: string | null
  category_name: string | null
  message: string | null
  source: string | null
  created_at: string | null
}

type CategoryFilter = 'ALL' | string

function formatDateTime(value: string | null): string {
  if (!value) return 'Not available'

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return 'Not available'
  }
}

function getLeadName(lead: PaidInterestLead): string {
  return lead.name?.trim() || lead.email?.split('@')[0] || 'Interested User'
}

function getCategoryName(lead: PaidInterestLead): string {
  return lead.category_name?.trim() || lead.category_slug || 'General Interest'
}

function getSourceLabel(source: string | null): string {
  if (!source) return 'Unknown Source'
  if (source === 'demo_result') return 'Demo Result'
  if (source === 'test_packs') return 'Test Packs'
  if (source === 'student_dashboard') return 'Student Dashboard'
  return source
}

function AdminPaidInterestPage() {
  const [leads, setLeads] = useState<PaidInterestLead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL')

  async function loadLeads() {
    setIsLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('paid_interest_leads')
      .select(
        'id, user_id, name, email, category_id, category_slug, category_name, message, source, created_at',
      )
      .order('created_at', { ascending: false })

    if (error) {
      setLeads([])
      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    setLeads((data ?? []) as PaidInterestLead[])
    setIsLoading(false)
  }

  useEffect(() => {
    void loadLeads()
  }, [])

  const categories = useMemo(() => {
    const uniqueCategories = new Map<string, string>()

    leads.forEach((lead) => {
      const slug = lead.category_slug || 'general'
      const name = getCategoryName(lead)
      uniqueCategories.set(slug, name)
    })

    return Array.from(uniqueCategories.entries()).map(([slug, name]) => ({
      slug,
      name,
    }))
  }, [leads])

  const stats = useMemo(() => {
    const totalLeads = leads.length
    const uniqueEmails = new Set(
      leads
        .map((lead) => lead.email?.trim().toLowerCase())
        .filter(Boolean),
    ).size
    const topicCount = categories.length
    const latestLead = leads[0]?.created_at || null

    return {
      totalLeads,
      uniqueEmails,
      topicCount,
      latestLead,
    }
  }, [categories.length, leads])

  const filteredLeads = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()

    return leads.filter((lead) => {
      const leadCategorySlug = lead.category_slug || 'general'
      const matchesCategory =
        categoryFilter === 'ALL' || leadCategorySlug === categoryFilter

      const searchableText = [
        lead.name,
        lead.email,
        lead.category_name,
        lead.category_slug,
        lead.message,
        getSourceLabel(lead.source),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })
  }, [categoryFilter, leads, searchText])

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Leads</p>
          <h1>Paid Pack Interest</h1>
          <p>
            Track users who are interested in future paid test packs, topic-wise
            access, and premium practice content.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadLeads()}
            disabled={isLoading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </section>

      {errorMessage ? (
        <section className="alert-message error-card">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </section>
      ) : null}

      <section className="dashboard-grid">
        <article className="dashboard-card">
          <div className="section-title-row">
            <span className="feature-icon">
              <TrendingUp size={22} />
            </span>
            <span className="status-pill">Total</span>
          </div>
          <h2>{stats.totalLeads}</h2>
          <p>Total paid-interest leads</p>
        </article>

        <article className="dashboard-card">
          <div className="section-title-row">
            <span className="feature-icon">
              <Mail size={22} />
            </span>
            <span className="status-pill info-pill">Emails</span>
          </div>
          <h2>{stats.uniqueEmails}</h2>
          <p>Unique email addresses</p>
        </article>

        <article className="dashboard-card">
          <div className="section-title-row">
            <span className="feature-icon">
              <Sparkles size={22} />
            </span>
            <span className="status-pill pending-pill">Topics</span>
          </div>
          <h2>{stats.topicCount}</h2>
          <p>Topics with interest</p>
        </article>

        <article className="dashboard-card">
          <div className="section-title-row">
            <span className="feature-icon">
              <CalendarDays size={22} />
            </span>
            <span className="status-pill approved-pill">Latest</span>
          </div>
          <h2>{stats.latestLead ? 'New Lead' : 'No Leads'}</h2>
          <p>{formatDateTime(stats.latestLead)}</p>
        </article>
      </section>

      <section className="content-card">
        <div className="section-title-row">
          <ClipboardList size={22} />
          <h2>Interest Lead Directory</h2>
        </div>

        <div className="create-exam-form">
          <div className="form-field">
            <label htmlFor="lead-search">
              <Search size={16} />
              Search lead
            </label>
            <input
              id="lead-search"
              type="search"
              placeholder="Search by name, email, topic, source, or message"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="category-filter">
              <Filter size={16} />
              Topic filter
            </label>
            <select
              id="category-filter"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="ALL">All topics</option>
              {categories.map((category) => (
                <option value={category.slug} key={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="placeholder-card">
            <p>Loading paid-interest leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="placeholder-card">
            <h2>No paid-interest leads found</h2>
            <p>
              Leads will appear here after users register interest from the demo
              result or paid-pack CTA.
            </p>
          </div>
        ) : (
          <div className="flow-list">
            {filteredLeads.map((lead) => (
              <article className="flow-item" key={lead.id}>
                <Users size={20} />

                <div>
                  <div className="section-title-row">
                    <h3>{getLeadName(lead)}</h3>
                    <span className="status-pill info-pill">
                      {getCategoryName(lead)}
                    </span>
                  </div>

                  <p>
                    <Mail size={15} />
                    {lead.email || 'Email not available'}
                  </p>

                  <p>
                    <CalendarDays size={15} />
                    Interested on {formatDateTime(lead.created_at)}
                  </p>

                  <p>
                    <Sparkles size={15} />
                    Source: {getSourceLabel(lead.source)}
                  </p>

                  {lead.message ? (
                    <p>
                      <MessageSquare size={15} />
                      {lead.message}
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPaidInterestPage
