import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FolderKanban,
  Loader2,
  RefreshCw,
  Save,
  Search,
  UserRoundCog,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

import './StudentProfilePage.css'

type StudentProfilePageProps = {
  profile: UserProfile
}

type ExamCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  display_order: number
  is_featured: boolean
}

type UserCategoryInterest = {
  id: string
  category_id: string
  category_slug: string | null
  is_active: boolean
}

function StudentProfilePage({ profile }: StudentProfilePageProps) {
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [interests, setInterests] = useState<UserCategoryInterest[]>([])
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const selectedCategories = useMemo(() => {
    return categories.filter((category) => selectedCategoryIds.includes(category.id))
  }, [categories, selectedCategoryIds])

  const filteredCategories = useMemo(() => {
    const search = searchText.trim().toLowerCase()

    if (!search) return categories

    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(search) ||
        category.slug.toLowerCase().includes(search) ||
        (category.description || '').toLowerCase().includes(search)
      )
    })
  }, [categories, searchText])

  async function loadProfileData() {
    setIsLoading(true)
    setMessage('')
    setErrorMessage('')

    const { data: categoryData, error: categoryError } = await supabase
      .from('exam_categories')
      .select('id, name, slug, description, display_order, is_featured')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (categoryError) {
      setErrorMessage(categoryError.message)
      setIsLoading(false)
      return
    }

    const loadedCategories = ((categoryData || []) as unknown) as ExamCategory[]
    setCategories(loadedCategories)

    const { data: interestData, error: interestError } = await supabase
      .from('user_category_interests')
      .select('id, category_id, category_slug, is_active')
      .eq('profile_id', profile.id)

    if (interestError) {
      setErrorMessage(interestError.message)
      setIsLoading(false)
      return
    }

    const loadedInterests = ((interestData || []) as unknown) as UserCategoryInterest[]
    setInterests(loadedInterests)

    const activeCategoryIds = loadedInterests
      .filter((interest) => interest.is_active)
      .map((interest) => interest.category_id)

    setSelectedCategoryIds(activeCategoryIds)
    setIsLoading(false)
  }

  useEffect(() => {
    void loadProfileData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId)
      }

      return [...current, categoryId]
    })
  }

  function selectAllVisible() {
    setSelectedCategoryIds((current) => {
      const merged = new Set([
        ...current,
        ...filteredCategories.map((category) => category.id),
      ])

      return Array.from(merged)
    })
  }

  function clearAll() {
    setSelectedCategoryIds([])
  }

  async function saveCategoryInterests() {
    setMessage('')
    setErrorMessage('')

    if (selectedCategoryIds.length === 0) {
      setErrorMessage('Please select at least one category.')
      return
    }

    setIsSaving(true)

    try {
      const now = new Date().toISOString()

      const rowsToUpsert = categories
        .filter((category) => selectedCategoryIds.includes(category.id))
        .map((category) => ({
          profile_id: profile.id,
          category_id: category.id,
          category_slug: category.slug,
          interest_source: 'profile',
          is_active: true,
          updated_at: now,
        }))

      if (rowsToUpsert.length > 0) {
        const { error: upsertError } = await supabase
          .from('user_category_interests')
          .upsert(rowsToUpsert, {
            onConflict: 'profile_id,category_id',
          })

        if (upsertError) {
          throw new Error(upsertError.message)
        }
      }

      const existingActiveInterests = interests.filter((interest) => interest.is_active)
      const categoryIdsToDeactivate = existingActiveInterests
        .map((interest) => interest.category_id)
        .filter((categoryId) => !selectedCategoryIds.includes(categoryId))

      if (categoryIdsToDeactivate.length > 0) {
        const { error: deactivateError } = await supabase
          .from('user_category_interests')
          .update({
            is_active: false,
            updated_at: now,
          })
          .eq('profile_id', profile.id)
          .in('category_id', categoryIdsToDeactivate)

        if (deactivateError) {
          throw new Error(deactivateError.message)
        }
      }

      setMessage('Your category preferences have been updated successfully.')
      await loadProfileData()
    } catch (error) {
      const errorText =
        error instanceof Error
          ? error.message
          : 'Unable to update category preferences.'

      setErrorMessage(errorText)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="tb-profile-page">
      <section className="tb-profile-shell">
        <header className="tb-profile-header">
          <div>
            <p>My Profile</p>

            <h1>Manage your TestBridge categories</h1>

            <span>
              These selected categories control what you see after login. You can
              add or remove categories anytime from this profile page.
            </span>
          </div>

          <Link className="tb-profile-secondary-button" to="/student">
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </header>

        {message ? (
          <div className="tb-profile-alert tb-profile-alert-success">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="tb-profile-alert tb-profile-alert-error">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <section className="tb-profile-grid">
          <aside className="tb-profile-card tb-profile-summary-card">
            <div className="tb-profile-avatar">
              <UserRoundCog size={34} />
            </div>

            <h2>{profile.name || 'TestBridge User'}</h2>

            <p>{profile.email}</p>

            <div className="tb-profile-summary-list">
              <div>
                <strong>Role</strong>
                <span>Test Taker</span>
              </div>

              <div>
                <strong>Selected Categories</strong>
                <span>{selectedCategoryIds.length}</span>
              </div>
            </div>

            {selectedCategories.length > 0 ? (
              <div className="tb-profile-selected-list">
                {selectedCategories.map((category) => (
                  <span key={category.id}>{category.name}</span>
                ))}
              </div>
            ) : (
              <div className="tb-profile-note">
                <AlertCircle size={18} />
                <span>No category selected yet.</span>
              </div>
            )}
          </aside>

          <section className="tb-profile-card tb-profile-category-card">
            <div className="tb-profile-section-title">
              <div>
                <h2>Category Access Preferences</h2>
                <p>
                  Select only the categories you want to practice. Your student
                  test list will be filtered using these categories.
                </p>
              </div>

              <span>{selectedCategoryIds.length} selected</span>
            </div>

            <div className="tb-profile-toolbar">
              <div className="tb-profile-search">
                <Search size={18} />
                <input
                  type="text"
                  value={searchText}
                  placeholder="Search categories..."
                  onChange={(event) => setSearchText(event.target.value)}
                />
              </div>

              <button type="button" onClick={selectAllVisible}>
                Select visible
              </button>

              <button
                type="button"
                onClick={clearAll}
                disabled={selectedCategoryIds.length === 0}
              >
                Clear all
              </button>

              <button
                type="button"
                onClick={() => void loadProfileData()}
                disabled={isLoading}
              >
                <RefreshCw size={17} />
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="tb-profile-empty">
                <Loader2 size={24} />
                <h3>Loading categories...</h3>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="tb-profile-empty">
                <FolderKanban size={24} />
                <h3>No category found</h3>
                <p>Try another search keyword.</p>
              </div>
            ) : (
              <div className="tb-profile-category-list">
                {filteredCategories.map((category) => {
                  const isSelected = selectedCategoryIds.includes(category.id)

                  return (
                    <label
                      className={
                        isSelected
                          ? 'tb-profile-category-option tb-profile-category-option-selected'
                          : 'tb-profile-category-option'
                      }
                      key={category.id}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCategory(category.id)}
                      />

                      <span>
                        <strong>
                          {category.name}
                          {category.is_featured ? <em>Featured</em> : null}
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

            <div className="tb-profile-save-row">
              <button
                type="button"
                className="tb-profile-primary-button"
                onClick={() => void saveCategoryInterests()}
                disabled={isSaving || isLoading}
              >
                {isSaving ? <Loader2 size={18} /> : <Save size={18} />}
                {isSaving ? 'Saving...' : 'Save Category Preferences'}
              </button>
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}

export default StudentProfilePage
