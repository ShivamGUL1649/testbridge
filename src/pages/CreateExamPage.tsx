import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  Loader2,
  Percent,
  PlusCircle,
  RefreshCw,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type CreateExamPageProps = {
  profile: UserProfile
}

type ExamCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  display_order: number
}

type CreateExamFormState = {
  title: string
  description: string
  categoryId: string
  totalQuestions: string
  totalTimeMinutes: string
  passingMarks: string
}

const emptyForm: CreateExamFormState = {
  title: '',
  description: '',
  categoryId: '',
  totalQuestions: '10',
  totalTimeMinutes: '45',
  passingMarks: '78',
}

function toPositiveInteger(value: string, fallback: number): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.max(1, Math.floor(parsed))
}

function toPercentage(value: string, fallback: number): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return fallback
  }

  return Math.min(100, Math.max(1, Math.floor(parsed)))
}

function CreateExamPage({ profile }: CreateExamPageProps) {
  const navigate = useNavigate()

  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [form, setForm] = useState<CreateExamFormState>(emptyForm)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === form.categoryId) || null,
    [categories, form.categoryId],
  )

  async function loadCategories() {
    setIsLoadingCategories(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('exam_categories')
      .select('id, name, slug, description, is_active, display_order')
      .eq('is_active', true)
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

    if (!form.categoryId && loadedCategories.length > 0) {
      setForm((current) => ({
        ...current,
        categoryId: loadedCategories[0].id,
      }))
    }

    setIsLoadingCategories(false)
  }

  useEffect(() => {
    void loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function updateField<Key extends keyof CreateExamFormState>(
    key: Key,
    value: CreateExamFormState[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function validateForm(): string | null {
    if (profile.role !== 'TUTOR') {
      return 'Only Test Creator can create tests from this page.'
    }

    if (!form.title.trim()) {
      return 'Test name is required.'
    }

    if (!form.categoryId || !selectedCategory) {
      return 'Please select a category for this test.'
    }

    if (toPositiveInteger(form.totalQuestions, 10) <= 0) {
      return 'Total questions must be greater than 0.'
    }

    if (toPositiveInteger(form.totalTimeMinutes, 45) <= 0) {
      return 'Total time must be greater than 0.'
    }

    const passingMarks = toPercentage(form.passingMarks, 78)

    if (passingMarks < 1 || passingMarks > 100) {
      return 'Passing percentage must be between 1 and 100.'
    }

    return null
  }

  async function handleCreateExam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

    const validationError = validateForm()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    if (!selectedCategory) {
      setErrorMessage('Selected category was not found. Please refresh and try again.')
      return
    }

    setIsCreating(true)

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      total_questions: toPositiveInteger(form.totalQuestions, 10),
      total_time_minutes: toPositiveInteger(form.totalTimeMinutes, 45),
      passing_marks: toPercentage(form.passingMarks, 78),
      status: 'DRAFT',
      created_by: profile.id,
      category_id: selectedCategory.id,
      category_slug: selectedCategory.slug,
      is_demo: false,
      demo_slug: null,
    }

    const { data, error } = await supabase
      .from('exams')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      setErrorMessage(error.message)
      setIsCreating(false)
      return
    }

    setSuccessMessage('Test created successfully. Redirecting to add questions...')

    window.setTimeout(() => {
      navigate(`/tutor/exam/${data.id}/questions`)
    }, 500)
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Create Test</p>
          <h1>Create a category-aligned practice test</h1>
          <p>
            Select the right category first so this test appears correctly in
            public demos, registered user dashboards, SEO pages, and future paid
            category access.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link className="secondary-button" to="/tutor/exams">
            <ArrowLeft size={18} />
            My Tests
          </Link>

          <button
            className="secondary-button"
            type="button"
            onClick={() => void loadCategories()}
            disabled={isLoadingCategories}
          >
            <RefreshCw size={18} />
            Refresh Categories
          </button>
        </div>
      </section>

      {successMessage ? (
        <div className="alert-message success-message">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="alert-message error-message">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <h2>Test Details</h2>
            <span className="status-pill">Draft</span>
          </div>

          <form className="form-card create-exam-form" onSubmit={handleCreateExam}>
            <label className="form-field">
              <span>Category *</span>
              <select
                value={form.categoryId}
                onChange={(event) => updateField('categoryId', event.target.value)}
                disabled={isLoadingCategories || categories.length === 0}
              >
                {isLoadingCategories ? (
                  <option value="">Loading categories...</option>
                ) : categories.length === 0 ? (
                  <option value="">No active categories found</option>
                ) : (
                  categories.map((category) => (
                    <option value={category.id} key={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
              <small>
                Categories are created and managed by Admin from Category Master.
              </small>
            </label>

            <label className="form-field">
              <span>Test Name *</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="Example: AWS Solutions Architect Practice Test 1"
              />
            </label>

            <label className="form-field">
              <span>Description</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="Short description visible to test takers."
              />
            </label>

            <div className="two-column-grid compact-grid">
              <label className="form-field">
                <span>Total Questions *</span>
                <input
                  type="number"
                  min="1"
                  value={form.totalQuestions}
                  onChange={(event) =>
                    updateField('totalQuestions', event.target.value)
                  }
                />
              </label>

              <label className="form-field">
                <span>Total Time Minutes *</span>
                <input
                  type="number"
                  min="1"
                  value={form.totalTimeMinutes}
                  onChange={(event) =>
                    updateField('totalTimeMinutes', event.target.value)
                  }
                />
              </label>
            </div>

            <label className="form-field">
              <span>Passing Percentage *</span>
              <input
                type="number"
                min="1"
                max="100"
                value={form.passingMarks}
                onChange={(event) =>
                  updateField('passingMarks', event.target.value)
                }
              />
            </label>

            <div className="hero-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={isCreating || isLoadingCategories || categories.length === 0}
              >
                {isCreating ? <Loader2 size={18} /> : <PlusCircle size={18} />}
                {isCreating ? 'Creating...' : 'Create Test and Add Questions'}
              </button>
            </div>
          </form>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <FolderKanban size={22} />
            <h2>Selected Category</h2>
          </div>

          {selectedCategory ? (
            <>
              <h3>{selectedCategory.name}</h3>
              <p>
                {selectedCategory.description ||
                  'No category description is configured yet.'}
              </p>

              <div className="flow-list">
                <div className="flow-item">
                  <FileText size={18} />
                  <span>Slug: {selectedCategory.slug}</span>
                </div>

                <div className="flow-item">
                  <FileText size={18} />
                  <span>Total questions: {form.totalQuestions || 0}</span>
                </div>

                <div className="flow-item">
                  <Clock size={18} />
                  <span>Test duration: {form.totalTimeMinutes || 0} minutes</span>
                </div>

                <div className="flow-item">
                  <Percent size={18} />
                  <span>Passing criteria: {form.passingMarks || 0}%</span>
                </div>
              </div>

              <div className="create-exam-note">
                <CheckCircle2 size={18} />
                <span>
                  This test will be saved in Draft status. Add questions next,
                  then submit it for Admin approval.
                </span>
              </div>
            </>
          ) : (
            <div className="placeholder-card">
              <p>
                No active category is available. Ask Admin to create at least one
                active category first.
              </p>
            </div>
          )}
        </article>
      </section>
    </main>
  )
}

export default CreateExamPage
