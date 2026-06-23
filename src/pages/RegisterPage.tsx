import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  FolderKanban,
  Loader2,
  LockKeyhole,
  Mail,
  Search,
  Sparkles,
  UserPlus,
  UserRound,
  X,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'

import './RegisterPage.css'

type RegisterPageProps = {
  onRegisterSuccess: () => Promise<void> | void
}

type Role = 'STUDENT' | 'TUTOR'

type ExamCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  display_order: number
  is_featured: boolean
}

type RegisterFormState = {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: Role
}

const initialForm: RegisterFormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'STUDENT',
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function getRoleLabel(role: Role): string {
  if (role === 'TUTOR') return 'Test Creator'
  return 'Test Taker'
}

function RegisterPage({ onRegisterSuccess }: RegisterPageProps) {
  const navigate = useNavigate()

  const [form, setForm] = useState<RegisterFormState>(initialForm)
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [categorySearch, setCategorySearch] = useState('')
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isRegistering, setIsRegistering] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const selectedCategories = useMemo(() => {
    return categories.filter((category) => selectedCategoryIds.includes(category.id))
  }, [categories, selectedCategoryIds])

  const filteredCategories = useMemo(() => {
    const search = categorySearch.trim().toLowerCase()

    if (!search) {
      return categories
    }

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(search) ||
        category.slug.toLowerCase().includes(search) ||
        (category.description || '').toLowerCase().includes(search)
      )
    })
  }, [categories, categorySearch])

  async function loadCategories() {
    setIsLoadingCategories(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('exam_categories')
      .select('id, name, slug, description, display_order, is_featured')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      setErrorMessage(error.message)
      setCategories([])
      setIsLoadingCategories(false)
      return
    }

    const loadedCategories = ((data || []) as unknown) as ExamCategory[]
    setCategories(loadedCategories)

    if (loadedCategories.length > 0 && selectedCategoryIds.length === 0) {
      setSelectedCategoryIds([loadedCategories[0].id])
    }

    setIsLoadingCategories(false)
  }

  useEffect(() => {
    void loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateField<Key extends keyof RegisterFormState>(
    key: Key,
    value: RegisterFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))

    if (key === 'role' && value === 'TUTOR') {
      setSelectedCategoryIds([])
      setIsCategoryDropdownOpen(false)
    }

    if (key === 'role' && value === 'STUDENT' && selectedCategoryIds.length === 0) {
      const firstCategory = categories[0]
      if (firstCategory) {
        setSelectedCategoryIds([firstCategory.id])
      }
    }
  }

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId)
      }

      return [...current, categoryId]
    })
  }

  function removeCategory(categoryId: string) {
    setSelectedCategoryIds((current) => current.filter((id) => id !== categoryId))
  }

  function selectAllVisibleCategories() {
    const visibleIds = filteredCategories.map((category) => category.id)

    setSelectedCategoryIds((current) => {
      const merged = new Set([...current, ...visibleIds])
      return Array.from(merged)
    })
  }

  function clearSelectedCategories() {
    setSelectedCategoryIds([])
  }

  function validateForm(): string | null {
    const cleanName = form.name.trim()
    const cleanEmail = form.email.trim().toLowerCase()

    if (!cleanName) {
      return 'Name is required.'
    }

    if (!isValidEmail(cleanEmail)) {
      return 'Please enter a valid email address.'
    }

    if (form.password.length < 6) {
      return 'Password must be at least 6 characters.'
    }

    if (form.password !== form.confirmPassword) {
      return 'Password and confirm password must match.'
    }

    if (form.role === 'STUDENT' && selectedCategoryIds.length === 0) {
      return 'Please select at least one category you are interested in.'
    }

    return null
  }

  async function saveCategoryInterests(profileId: string) {
    if (form.role !== 'STUDENT' || selectedCategoryIds.length === 0) {
      return
    }

    const selectedRows = categories
      .filter((category) => selectedCategoryIds.includes(category.id))
      .map((category) => ({
        profile_id: profileId,
        category_id: category.id,
        category_slug: category.slug,
        interest_source: 'registration',
        is_active: true,
        updated_at: new Date().toISOString(),
      }))

    if (selectedRows.length === 0) {
      return
    }

    const { error } = await supabase
      .from('user_category_interests')
      .upsert(selectedRows, {
        onConflict: 'profile_id,category_id',
      })

    if (error) {
      throw new Error(error.message)
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    const validationError = validateForm()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsRegistering(true)

    const cleanName = form.name.trim()
    const cleanEmail = form.email.trim().toLowerCase()

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: form.password,
        options: {
          data: {
            name: cleanName,
            role: form.role,
            selected_category_ids: selectedCategoryIds,
          },
        },
      })

      if (signUpError) {
        throw new Error(signUpError.message)
      }

      const authUser = signUpData.user

      if (!authUser) {
        throw new Error('Unable to create authentication user.')
      }

      let profileId: string | null = null

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          auth_user_id: authUser.id,
          name: cleanName,
          email: cleanEmail,
          role: form.role,
          is_active: true,
          is_deleted: false,
        })
        .select('id')
        .single()

      if (!profileError && profileData) {
        profileId = (profileData as { id: string }).id
      } else {
        console.warn(
          'Profile insert was skipped or blocked. App login guard will auto-create the profile after login.',
          profileError?.message,
        )
      }

      if (profileId) {
        await saveCategoryInterests(profileId)
      }

      setSuccessMessage(
        form.role === 'STUDENT'
          ? 'Registration successful. Your selected categories will be saved with your profile.'
          : 'Registration successful. You can now login as a Test Creator.',
      )

      if (signUpData.session) {
        await onRegisterSuccess()

        window.setTimeout(() => {
          navigate(form.role === 'TUTOR' ? '/tutor' : '/student')
        }, 500)
      } else {
        await supabase.auth.signOut()

        window.setTimeout(() => {
          navigate('/login')
        }, 500)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to complete registration.'

      setErrorMessage(message)
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <main className="tb-register-page">
      <section className="tb-register-shell">
        <article className="tb-register-card">
          <div className="tb-register-heading">
            <p>Create Account</p>

            <h1>Register for TestBridge</h1>

            <span>
              Select your role. Test Takers must choose interested categories so
              future access and payment can be mapped category-wise.
            </span>
          </div>

          {successMessage ? (
            <div className="tb-register-alert tb-register-alert-success">
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="tb-register-alert tb-register-alert-error">
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <form className="tb-register-form" onSubmit={handleRegister}>
            <label className="tb-register-field">
              <span>Full Name *</span>
              <div className="tb-register-input-wrap">
                <UserRound size={18} />
                <input
                  type="text"
                  value={form.name}
                  placeholder="Your name"
                  autoComplete="name"
                  onChange={(event) => updateField('name', event.target.value)}
                />
              </div>
            </label>

            <label className="tb-register-field">
              <span>Email *</span>
              <div className="tb-register-input-wrap">
                <Mail size={18} />
                <input
                  type="email"
                  value={form.email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  onChange={(event) => updateField('email', event.target.value)}
                />
              </div>
            </label>

            <div className="tb-register-two-col">
              <label className="tb-register-field">
                <span>Password *</span>
                <div className="tb-register-input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    onChange={(event) => updateField('password', event.target.value)}
                  />
                  <button
                    type="button"
                    className="tb-register-icon-button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="tb-register-field">
                <span>Confirm Password *</span>
                <div className="tb-register-input-wrap">
                  <LockKeyhole size={18} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    onChange={(event) =>
                      updateField('confirmPassword', event.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="tb-register-icon-button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    aria-label={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>

            <label className="tb-register-field">
              <span>Register As *</span>
              <select
                value={form.role}
                onChange={(event) => updateField('role', event.target.value as Role)}
              >
                <option value="STUDENT">Test Taker</option>
                <option value="TUTOR">Test Creator</option>
              </select>
            </label>

            {form.role === 'STUDENT' ? (
              <section className="tb-category-select">
                <div className="tb-category-select-head">
                  <div>
                    <h2>Interested Categories *</h2>
                    <p>
                      Choose one or more categories. This will help us show
                      relevant tests now and support category-based payment later.
                    </p>
                  </div>

                  <span>{selectedCategoryIds.length} selected</span>
                </div>

                <div className="tb-category-dropdown">
                  <button
                    type="button"
                    className="tb-category-dropdown-button"
                    onClick={() =>
                      setIsCategoryDropdownOpen((current) => !current)
                    }
                  >
                    <span>
                      {selectedCategories.length === 0
                        ? 'Select interested categories'
                        : `${selectedCategories.length} categories selected`}
                    </span>

                    <ChevronDown
                      size={20}
                      className={isCategoryDropdownOpen ? 'tb-chevron-open' : ''}
                    />
                  </button>

                  {selectedCategories.length > 0 ? (
                    <div className="tb-selected-category-chips">
                      {selectedCategories.map((category) => (
                        <span className="tb-category-chip" key={category.id}>
                          {category.name}
                          <button
                            type="button"
                            aria-label={`Remove ${category.name}`}
                            onClick={() => removeCategory(category.id)}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {isCategoryDropdownOpen ? (
                    <div className="tb-category-dropdown-panel">
                      <div className="tb-category-search">
                        <Search size={18} />
                        <input
                          type="text"
                          value={categorySearch}
                          placeholder="Search category..."
                          onChange={(event) => setCategorySearch(event.target.value)}
                        />
                      </div>

                      <div className="tb-category-actions">
                        <button
                          type="button"
                          onClick={selectAllVisibleCategories}
                          disabled={filteredCategories.length === 0}
                        >
                          Select visible
                        </button>

                        <button
                          type="button"
                          onClick={clearSelectedCategories}
                          disabled={selectedCategoryIds.length === 0}
                        >
                          Clear
                        </button>
                      </div>

                      {isLoadingCategories ? (
                        <div className="tb-category-empty">
                          <Loader2 size={20} />
                          <span>Loading categories...</span>
                        </div>
                      ) : filteredCategories.length === 0 ? (
                        <div className="tb-category-empty">
                          <FolderKanban size={20} />
                          <span>No category matched your search.</span>
                        </div>
                      ) : (
                        <div className="tb-category-list">
                          {filteredCategories.map((category) => {
                            const isSelected = selectedCategoryIds.includes(category.id)

                            return (
                              <label
                                className={
                                  isSelected
                                    ? 'tb-category-option tb-category-option-selected'
                                    : 'tb-category-option'
                                }
                                key={category.id}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleCategory(category.id)}
                                />

                                <span className="tb-category-option-text">
                                  <strong>
                                    {category.name}
                                    {category.is_featured ? (
                                      <em>Featured</em>
                                    ) : null}
                                  </strong>

                                  <small>
                                    {category.description ||
                                      'Practice tests available under this category.'}
                                  </small>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : (
              <div className="tb-register-note">
                <Sparkles size={18} />
                <span>
                  Test Creator accounts can create tests and align each test to
                  an Admin-managed category.
                </span>
              </div>
            )}

            <button
              type="submit"
              className="tb-register-submit"
              disabled={isRegistering || isLoadingCategories}
            >
              {isRegistering ? <Loader2 size={18} /> : <UserPlus size={18} />}
              {isRegistering ? 'Creating Account...' : `Register as ${getRoleLabel(form.role)}`}
            </button>
          </form>

          <p className="tb-register-switch">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </article>

        <aside className="tb-register-info">
          <p>Why categories matter</p>

          <h2>Category selection is the base for future paid access.</h2>

          <div className="tb-register-info-list">
            <div>
              <CheckCircle2 size={18} />
              <span>Users select topics during registration.</span>
            </div>

            <div>
              <CheckCircle2 size={18} />
              <span>Student dashboard can prioritize selected categories.</span>
            </div>

            <div>
              <CheckCircle2 size={18} />
              <span>Future payment can unlock one or more categories.</span>
            </div>
          </div>

          {selectedCategories.length > 0 ? (
            <div className="tb-register-selected-summary">
              <FolderKanban size={18} />
              <span>
                Selected: {selectedCategories.map((category) => category.name).join(', ')}
              </span>
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  )
}

export default RegisterPage
