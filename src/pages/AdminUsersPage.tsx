import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Filter,
  GraduationCap,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'

type RegisteredUser = {
  id: string
  auth_user_id: string | null
  name: string | null
  email: string | null
  role: string | null
  created_at: string | null
}

type RoleFilter = 'ALL' | 'ADMIN' | 'TUTOR' | 'STUDENT'

function formatDate(value: string | null): string {
  if (!value) return 'Not available'

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return 'Not available'
  }
}

function getRoleLabel(role: string | null): string {
  if (role === 'ADMIN') return 'Admin'
  if (role === 'TUTOR') return 'Test Creator'
  if (role === 'STUDENT') return 'Test Taker'
  return 'Unknown'
}

function getRoleClassName(role: string | null): string {
  if (role === 'ADMIN') return 'status-pill approved-pill'
  if (role === 'TUTOR') return 'status-pill pending-pill'
  if (role === 'STUDENT') return 'status-pill info-pill'
  return 'status-pill'
}

function getDisplayName(user: RegisteredUser): string {
  return user.name?.trim() || user.email?.split('@')[0] || 'Unnamed User'
}

function AdminUsersPage() {
  const [users, setUsers] = useState<RegisteredUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')

  async function loadUsers() {
    setIsLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('profiles')
      .select('id, auth_user_id, name, email, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setUsers([])
      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    setUsers((data ?? []) as RegisteredUser[])
    setIsLoading(false)
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const stats = useMemo(() => {
    const totalUsers = users.length
    const admins = users.filter((user) => user.role === 'ADMIN').length
    const testCreators = users.filter((user) => user.role === 'TUTOR').length
    const testTakers = users.filter((user) => user.role === 'STUDENT').length

    return {
      totalUsers,
      admins,
      testCreators,
      testTakers,
    }
  }, [users])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()

    return users.filter((user) => {
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter

      const searchableText = [
        user.name,
        user.email,
        getRoleLabel(user.role),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        normalizedSearch.length === 0 || searchableText.includes(normalizedSearch)

      return matchesRole && matchesSearch
    })
  }, [users, roleFilter, searchText])

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Users</p>
          <h1>Registered Users</h1>
          <p>
            View all registered TestBridge users, filter by role, and quickly
            check who is using the platform.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadUsers()}
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
              <Users size={22} />
            </span>
            <span className="status-pill">Total</span>
          </div>
          <h2>{stats.totalUsers}</h2>
          <p>Total registered users</p>
        </article>

        <article className="dashboard-card">
          <div className="section-title-row">
            <span className="feature-icon">
              <ShieldCheck size={22} />
            </span>
            <span className="status-pill approved-pill">Admin</span>
          </div>
          <h2>{stats.admins}</h2>
          <p>Platform administrators</p>
        </article>

        <article className="dashboard-card">
          <div className="section-title-row">
            <span className="feature-icon">
              <UserCheck size={22} />
            </span>
            <span className="status-pill pending-pill">Creators</span>
          </div>
          <h2>{stats.testCreators}</h2>
          <p>Registered Test Creators</p>
        </article>

        <article className="dashboard-card">
          <div className="section-title-row">
            <span className="feature-icon">
              <GraduationCap size={22} />
            </span>
            <span className="status-pill info-pill">Takers</span>
          </div>
          <h2>{stats.testTakers}</h2>
          <p>Registered Test Takers</p>
        </article>
      </section>

      <section className="content-card">
        <div className="section-title-row">
          <Users size={22} />
          <h2>User Directory</h2>
        </div>

        <div className="create-exam-form">
          <div className="form-field">
            <label htmlFor="user-search">
              <Search size={16} />
              Search user
            </label>
            <input
              id="user-search"
              type="search"
              placeholder="Search by name, email, or role"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="role-filter">
              <Filter size={16} />
              Role filter
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
            >
              <option value="ALL">All users</option>
              <option value="ADMIN">Admin</option>
              <option value="TUTOR">Test Creator</option>
              <option value="STUDENT">Test Taker</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="placeholder-card">
            <p>Loading registered users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="placeholder-card">
            <h2>No users found</h2>
            <p>Try changing the search text or role filter.</p>
          </div>
        ) : (
          <div className="flow-list">
            {filteredUsers.map((user) => (
              <article className="flow-item" key={user.id}>
                <Users size={20} />

                <div>
                  <div className="section-title-row">
                    <h3>{getDisplayName(user)}</h3>
                    <span className={getRoleClassName(user.role)}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>

                  <p>
                    <Mail size={15} />
                    {user.email || 'Email not available'}
                  </p>

                  <p>
                    <CalendarDays size={15} />
                    Registered on {formatDate(user.created_at)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminUsersPage
