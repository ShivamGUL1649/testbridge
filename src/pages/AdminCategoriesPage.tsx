import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Trash2,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'

type ExamCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  page_heading: string | null
  page_subheading: string | null
  page_content: string | null
  is_active: boolean
  allow_public_landing: boolean
  demo_enabled: boolean
  free_demo_count: number
  demo_question_limit: number
  demo_duration_minutes: number
  show_demo_explanations: boolean
  show_register_cta: boolean
  display_order: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

type CategoryFormState = {
  id: string
  name: string
  slug: string
  description: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  pageHeading: string
  pageSubheading: string
  pageContent: string
  isActive: boolean
  allowPublicLanding: boolean
  demoEnabled: boolean
  freeDemoCount: string
  showDemoExplanations: boolean
  showRegisterCta: boolean
  displayOrder: string
  isFeatured: boolean
}

const emptyForm: CategoryFormState = {
  id: '',
  name: '',
  slug: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  pageHeading: '',
  pageSubheading: '',
  pageContent: '',
  isActive: true,
  allowPublicLanding: true,
  demoEnabled: true,
  freeDemoCount: '1',
  showDemoExplanations: true,
  showRegisterCta: true,
  displayOrder: '100',
  isFeatured: false,
}

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function toPositiveNumber(value: string, fallback: number, minValue = 0): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.max(minValue, Math.floor(parsed))
}

function createFormFromCategory(category: ExamCategory): CategoryFormState {
  return {
    id: category.id,
    name: category.name || '',
    slug: category.slug || '',
    description: category.description || '',
    seoTitle: category.seo_title || '',
    seoDescription: category.seo_description || '',
    seoKeywords: category.seo_keywords || '',
    pageHeading: category.page_heading || '',
    pageSubheading: category.page_subheading || '',
    pageContent: category.page_content || '',
    isActive: category.is_active,
    allowPublicLanding: category.allow_public_landing,
    demoEnabled: category.demo_enabled,
    freeDemoCount: String(category.free_demo_count ?? 1),
    showDemoExplanations: category.show_demo_explanations,
    showRegisterCta: category.show_register_cta,
    displayOrder: String(category.display_order ?? 100),
    isFeatured: category.is_featured,
  }
}

function getPublicPracticePath(slug: string): string {
  return `/practice/${slug}`
}

function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [form, setForm] = useState<CategoryFormState>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const isEditing = Boolean(form.id)

  const filteredCategories = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase()

    return categories.filter((category) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && category.is_active) ||
        (statusFilter === 'INACTIVE' && !category.is_active)

      const matchesSearch =
        !normalizedSearch ||
        category.name.toLowerCase().includes(normalizedSearch) ||
        category.slug.toLowerCase().includes(normalizedSearch) ||
        (category.description || '').toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [categories, searchText, statusFilter])

  async function loadCategories() {
    setIsLoading(true)
    setError('')
    setMessage('')

    const { data, error: loadError } = await supabase
      .from('exam_categories')
      .select(
        [
          'id',
          'name',
          'slug',
          'description',
          'seo_title',
          'seo_description',
          'seo_keywords',
          'page_heading',
          'page_subheading',
          'page_content',
          'is_active',
          'allow_public_landing',
          'demo_enabled',
          'free_demo_count',
          'demo_question_limit',
          'demo_duration_minutes',
          'show_demo_explanations',
          'show_register_cta',
          'display_order',
          'is_featured',
          'created_at',
          'updated_at',
        ].join(', '),
      )
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })

    if (loadError) {
      setError(loadError.message)
      setCategories([])
      setIsLoading(false)
      return
    }

    setCategories(((data || []) as unknown) as ExamCategory[])
    setIsLoading(false)
  }

  useEffect(() => {
    void loadCategories()
  }, [])

  function updateField<K extends keyof CategoryFormState>(
    key: K,
    value: CategoryFormState[K],
  ) {
    setForm((current) => {
      if (key === 'name' && !current.id) {
        return {
          ...current,
          name: value as string,
          slug: normalizeSlug(value as string),
          pageHeading: value as string,
          seoTitle: `${value as string} Practice Tests | TestBridge`,
        }
      }

      if (key === 'slug') {
        return {
          ...current,
          slug: normalizeSlug(value as string),
        }
      }

      return {
        ...current,
        [key]: value,
      }
    })
  }

  function resetForm() {
    setForm(emptyForm)
    setError('')
    setMessage('')
  }

  function editCategory(category: ExamCategory) {
    setForm(createFormFromCategory(category))
    setError('')
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveCategory() {
    setIsSaving(true)
    setError('')
    setMessage('')

    const name = form.name.trim()
    const slug = normalizeSlug(form.slug || form.name)

    if (!name) {
      setError('Category name is required.')
      setIsSaving(false)
      return
    }

    if (!slug) {
      setError('SEO slug is required.')
      setIsSaving(false)
      return
    }

    const payload = {
      name,
      slug,
      description: form.description.trim() || null,
      seo_title:
        form.seoTitle.trim() || `${name} Practice Tests | TestBridge`,
      seo_description:
        form.seoDescription.trim() ||
        `Practice ${name} with certification-style questions, demo tests, and detailed explanations on TestBridge.`,
      seo_keywords: form.seoKeywords.trim() || null,
      page_heading: form.pageHeading.trim() || `${name} Practice Tests`,
      page_subheading:
        form.pageSubheading.trim() ||
        `Prepare for ${name} with focused practice tests and result review.`,
      page_content: form.pageContent.trim() || null,
      is_active: form.isActive,
      allow_public_landing: form.allowPublicLanding,
      demo_enabled: form.demoEnabled,
      free_demo_count: toPositiveNumber(form.freeDemoCount, 1, 1),
      show_demo_explanations: form.showDemoExplanations,
      show_register_cta: form.showRegisterCta,
      display_order: toPositiveNumber(form.displayOrder, 100, 0),
      is_featured: form.isFeatured,
      updated_at: new Date().toISOString(),
    }

    if (isEditing) {
      const { error: updateError } = await supabase
        .from('exam_categories')
        .update(payload)
        .eq('id', form.id)

      if (updateError) {
        setError(updateError.message)
        setIsSaving(false)
        return
      }

      setMessage('Category updated successfully.')
    } else {
      const { error: insertError } = await supabase
        .from('exam_categories')
        .insert(payload)

      if (insertError) {
        setError(insertError.message)
        setIsSaving(false)
        return
      }

      setMessage('Category created successfully.')
      setForm(emptyForm)
    }

    await loadCategories()
    setIsSaving(false)
  }

  async function setCategoryActive(category: ExamCategory, isActive: boolean) {
    const confirmMessage = isActive
      ? `Restore "${category.name}" and show it again?`
      : `Remove "${category.name}" from UI, demo, registration, and SEO listing?`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setError('')
    setMessage('')

    const { error: updateError } = await supabase
      .from('exam_categories')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', category.id)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setMessage(isActive ? 'Category restored successfully.' : 'Category removed from UI successfully.')

    if (form.id === category.id) {
      setForm((current) => ({
        ...current,
        isActive,
      }))
    }

    await loadCategories()
  }

  async function duplicateCategory(category: ExamCategory) {
    const duplicatedName = `${category.name} Copy`
    const duplicatedSlug = normalizeSlug(`${category.slug}-copy`)

    setForm({
      ...createFormFromCategory(category),
      id: '',
      name: duplicatedName,
      slug: duplicatedSlug,
      pageHeading: `${duplicatedName} Practice Tests`,
      seoTitle: `${duplicatedName} Practice Tests | TestBridge`,
      displayOrder: String((category.display_order ?? 100) + 1),
      isActive: true,
    })

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Category Master</p>
          <h1>Create and manage dynamic SEO-friendly categories</h1>
          <p>
            Categories control SEO, registration interests, public demo visibility,
            test creation alignment, student visibility, and future paid category access.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadCategories()}
            disabled={isLoading}
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button className="primary-button" type="button" onClick={resetForm}>
            <PlusCircle size={18} />
            New Category
          </button>
        </div>
      </section>

      {message ? (
        <div className="alert-message success-message">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      ) : null}

      {error ? (
        <div className="alert-message error-message">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <h2>{isEditing ? 'Edit Category' : 'Create Category'}</h2>
            <span className="status-pill">{isEditing ? 'Manage' : 'New'}</span>
          </div>

          <div className="create-exam-form">
            <label className="form-field">
              <span>Category Name *</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Example: AWS Solutions Architect"
              />
            </label>

            <label className="form-field">
              <span>SEO Slug *</span>
              <input
                type="text"
                value={form.slug}
                onChange={(event) => updateField('slug', event.target.value)}
                placeholder="aws-solutions-architect"
              />
              <small>Public URL: {getPublicPracticePath(form.slug || 'category-slug')}</small>
            </label>

            <label className="form-field">
              <span>Description</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Short category description for cards and lists."
              />
            </label>

            <div className="two-column-grid compact-grid">
              <label className="form-field">
                <span>Display Order</span>
                <input
                  type="number"
                  min="0"
                  value={form.displayOrder}
                  onChange={(event) => updateField('displayOrder', event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Free Demo Count</span>
                <input
                  type="number"
                  min="1"
                  value={form.freeDemoCount}
                  onChange={(event) => updateField('freeDemoCount', event.target.value)}
                />
              </label>
            </div>

            <label className="form-field">
              <span>SEO Title</span>
              <input
                type="text"
                value={form.seoTitle}
                onChange={(event) => updateField('seoTitle', event.target.value)}
                placeholder="AWS Solutions Architect Practice Tests | TestBridge"
              />
            </label>

            <label className="form-field">
              <span>SEO Description</span>
              <textarea
                rows={3}
                value={form.seoDescription}
                onChange={(event) => updateField('seoDescription', event.target.value)}
                placeholder="Write a search-friendly summary for this category."
              />
            </label>

            <label className="form-field">
              <span>SEO Keywords</span>
              <input
                type="text"
                value={form.seoKeywords}
                onChange={(event) => updateField('seoKeywords', event.target.value)}
                placeholder="aws practice test, solutions architect questions"
              />
            </label>

            <label className="form-field">
              <span>Public Page Heading</span>
              <input
                type="text"
                value={form.pageHeading}
                onChange={(event) => updateField('pageHeading', event.target.value)}
                placeholder="AWS Solutions Architect Practice Tests"
              />
            </label>

            <label className="form-field">
              <span>Public Page Subheading</span>
              <textarea
                rows={2}
                value={form.pageSubheading}
                onChange={(event) => updateField('pageSubheading', event.target.value)}
                placeholder="Explain why this practice category is useful."
              />
            </label>

            <label className="form-field">
              <span>Public Page Content</span>
              <textarea
                rows={5}
                value={form.pageContent}
                onChange={(event) => updateField('pageContent', event.target.value)}
                placeholder="Optional marketing content that will appear on the category landing page."
              />
            </label>

            <div className="checkbox-grid">
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => updateField('isActive', event.target.checked)}
                />
                <span>Active / visible in UI</span>
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.allowPublicLanding}
                  onChange={(event) =>
                    updateField('allowPublicLanding', event.target.checked)
                  }
                />
                <span>Allow public SEO landing page</span>
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.demoEnabled}
                  onChange={(event) => updateField('demoEnabled', event.target.checked)}
                />
                <span>Enable free demo</span>
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => updateField('isFeatured', event.target.checked)}
                />
                <span>Featured category</span>
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.showDemoExplanations}
                  onChange={(event) =>
                    updateField('showDemoExplanations', event.target.checked)
                  }
                />
                <span>Show demo explanations</span>
              </label>

              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.showRegisterCta}
                  onChange={(event) =>
                    updateField('showRegisterCta', event.target.checked)
                  }
                />
                <span>Show register CTA after demo</span>
              </label>
            </div>

            <div className="hero-actions">
              <button
                type="button"
                className="primary-button"
                disabled={isSaving}
                onClick={() => void saveCategory()}
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
              </button>

              <button type="button" className="secondary-button" onClick={resetForm}>
                Clear
              </button>
            </div>
          </div>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <h2>Category Rules</h2>
            <span className="status-pill">Important</span>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Only Admin can create, edit, remove, or restore categories.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Inactive categories are hidden from demo, registration, and SEO pages.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Free demo count controls how many approved tests from this category appear publicly.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Category slug becomes the SEO URL, so keep it readable and stable.</span>
            </div>

            <div className="flow-item">
              <CheckCircle2 size={18} />
              <span>Test duration and total questions are configured on each test, not on the category.</span>
            </div>
          </div>

          <div className="create-exam-note">
            <AlertCircle size={18} />
            <span>
              We use safe delete by marking a category inactive. This protects
              old tests, attempts, reports, and payment history.
            </span>
          </div>
        </article>
      </section>

      <section className="content-card">
        <div className="section-title-row">
          <div>
            <h2>Existing Categories</h2>
            <p>Manage all active and inactive categories from one list.</p>
          </div>

          <span className="status-pill">{filteredCategories.length} shown</span>
        </div>

        <div className="dashboard-actions category-toolbar">
          <label className="form-field search-field">
            <span>Search</span>
            <div className="search-input-wrap">
              <Search size={18} />
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by name, slug, or description"
              />
            </div>
          </label>

          <label className="form-field">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')
              }
            >
              <option value="ALL">All categories</option>
              <option value="ACTIVE">Active only</option>
              <option value="INACTIVE">Inactive only</option>
            </select>
          </label>
        </div>

        {isLoading ? (
          <div className="placeholder-card">
            <p>Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="placeholder-card">
            <p>No categories found.</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {filteredCategories.map((category) => (
              <article
                className={`dashboard-card ${category.is_active ? '' : 'muted-card'}`}
                key={category.id}
              >
                <div className="section-title-row">
                  <span className="status-pill">
                    {category.is_active ? 'Active' : 'Removed'}
                  </span>

                  <span className="status-pill">
                    {category.demo_enabled ? `${category.free_demo_count} demo` : 'Demo off'}
                  </span>
                </div>

                <h2>{category.name}</h2>

                <p>{category.description || 'No description added yet.'}</p>

                <div className="flow-list compact-flow">
                  <div className="flow-item">
                    <span>Slug:</span>
                    <strong>{category.slug}</strong>
                  </div>

                  <div className="flow-item">
                    <span>Public page:</span>
                    <strong>
                      {category.allow_public_landing
                        ? getPublicPracticePath(category.slug)
                        : 'Disabled'}
                    </strong>
                  </div>

                  <div className="flow-item">
                    <span>Order:</span>
                    <strong>{category.display_order}</strong>
                  </div>
                </div>

                <div className="hero-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => editCategory(category)}
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void duplicateCategory(category)}
                  >
                    <PlusCircle size={16} />
                    Copy
                  </button>

                  {category.is_active ? (
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => void setCategoryActive(category, false)}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => void setCategoryActive(category, true)}
                    >
                      <RotateCcw size={16} />
                      Restore
                    </button>
                  )}
                </div>

                <div className="create-exam-note">
                  {category.allow_public_landing ? <Eye size={16} /> : <EyeOff size={16} />}
                  <span>
                    {category.allow_public_landing
                      ? 'SEO landing page allowed'
                      : 'SEO landing page disabled'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminCategoriesPage
