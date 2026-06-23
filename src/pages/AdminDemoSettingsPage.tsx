import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  RefreshCw,
  Save,
  Settings,
  Sparkles,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'

type ExamCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  seo_title: string | null
  seo_description: string | null
  is_active: boolean
  deleted_at: string | null
  demo_enabled: boolean
  demo_exam_id: string | null
  demo_question_limit: number
  demo_duration_minutes: number
  show_demo_explanations: boolean
  show_register_cta: boolean
  created_at: string
  updated_at: string
}

type ExamOption = {
  id: string
  title: string
  status: string
  category_id: string | null
  category_slug: string | null
  is_demo: boolean
  is_free_demo: boolean | null
  demo_slug: string | null
  total_time_minutes: number | null
}

type DemoFormState = {
  categoryId: string
  demoEnabled: boolean
  demoExamId: string
  demoQuestionLimit: number
  demoDurationMinutes: number
  showDemoExplanations: boolean
  showRegisterCta: boolean
}

function createDemoSlug(categorySlug: string): string {
  return `${categorySlug}-demo`
}

function AdminDemoSettingsPage() {
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [exams, setExams] = useState<ExamOption[]>([])
  const [form, setForm] = useState<DemoFormState>({
    categoryId: '',
    demoEnabled: false,
    demoExamId: '',
    demoQuestionLimit: 10,
    demoDurationMinutes: 15,
    showDemoExplanations: true,
    showRegisterCta: true,
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const selectedCategory = useMemo(() => {
    return categories.find((category) => category.id === form.categoryId) || null
  }, [categories, form.categoryId])

  const selectedExam = useMemo(() => {
    return exams.find((exam) => exam.id === form.demoExamId) || null
  }, [exams, form.demoExamId])

  const approvedExamsForSelectedCategory = useMemo(() => {
    if (!selectedCategory) {
      return []
    }

    return exams.filter(
      (exam) =>
        exam.status === 'APPROVED' &&
        (exam.category_id === selectedCategory.id ||
          exam.category_slug === selectedCategory.slug),
    )
  }, [exams, selectedCategory])

  const publicDemoUrl = selectedCategory
    ? `/demo/${createDemoSlug(selectedCategory.slug)}`
    : '/demo'

  function buildFormFromCategory(category: ExamCategory): DemoFormState {
    return {
      categoryId: category.id,
      demoEnabled: Boolean(category.demo_enabled),
      demoExamId: category.demo_exam_id || '',
      demoQuestionLimit: category.demo_question_limit || 10,
      demoDurationMinutes: category.demo_duration_minutes || 15,
      showDemoExplanations:
        category.show_demo_explanations === null ||
        category.show_demo_explanations === undefined
          ? true
          : Boolean(category.show_demo_explanations),
      showRegisterCta:
        category.show_register_cta === null ||
        category.show_register_cta === undefined
          ? true
          : Boolean(category.show_register_cta),
    }
  }

  async function loadData() {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const [categoriesResponse, examsResponse] = await Promise.all([
        supabase
          .from('exam_categories')
          .select(
            [
              'id',
              'name',
              'slug',
              'description',
              'seo_title',
              'seo_description',
              'is_active',
              'deleted_at',
              'demo_enabled',
              'demo_exam_id',
              'demo_question_limit',
              'demo_duration_minutes',
              'show_demo_explanations',
              'show_register_cta',
              'created_at',
              'updated_at',
            ].join(', '),
          )
          .eq('is_active', true)
          .is('deleted_at', null)
          .order('name', { ascending: true }),

        supabase
          .from('exams')
          .select(
            [
              'id',
              'title',
              'status',
              'category_id',
              'category_slug',
              'is_demo',
              'is_free_demo',
              'demo_slug',
              'total_time_minutes',
            ].join(', '),
          )
          .eq('status', 'APPROVED')
          .order('title', { ascending: true }),
      ])

      if (categoriesResponse.error) {
        throw new Error(categoriesResponse.error.message)
      }

      if (examsResponse.error) {
        throw new Error(examsResponse.error.message)
      }

      const loadedCategories =
        ((categoriesResponse.data || []) as unknown) as ExamCategory[]

      const loadedExams =
        ((examsResponse.data || []) as unknown) as ExamOption[]

      setCategories(loadedCategories)
      setExams(loadedExams)

      if (loadedCategories.length > 0) {
        const currentCategoryStillExists = loadedCategories.find(
          (category) => category.id === form.categoryId,
        )

        setForm(
          buildFormFromCategory(
            currentCategoryStillExists || loadedCategories[0],
          ),
        )
      } else {
        setForm({
          categoryId: '',
          demoEnabled: false,
          demoExamId: '',
          demoQuestionLimit: 10,
          demoDurationMinutes: 15,
          showDemoExplanations: true,
          showRegisterCta: true,
        })
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load demo settings.'

      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleCategoryChange(categoryId: string) {
    const category = categories.find((item) => item.id === categoryId)

    if (!category) {
      return
    }

    setSuccessMessage('')
    setErrorMessage('')
    setForm(buildFormFromCategory(category))
  }

  async function handleSave() {
    if (!selectedCategory) {
      setErrorMessage('Please select an active category first.')
      return
    }

    if (!selectedCategory.is_active || selectedCategory.deleted_at) {
      setErrorMessage('This category is inactive or deleted. Please choose another category.')
      return
    }

    if (form.demoEnabled && !form.demoExamId) {
      setErrorMessage('Please select a demo test before enabling demo.')
      return
    }

    if (form.demoEnabled && !selectedExam) {
      setErrorMessage('Selected demo test is not available. Please select another approved test.')
      return
    }

    if (
      form.demoEnabled &&
      selectedExam &&
      selectedExam.category_id !== selectedCategory.id &&
      selectedExam.category_slug !== selectedCategory.slug
    ) {
      setErrorMessage('Selected demo test does not belong to the selected category.')
      return
    }

    if (form.demoQuestionLimit < 1 || form.demoQuestionLimit > 50) {
      setErrorMessage('Demo question limit must be between 1 and 50.')
      return
    }

    if (form.demoDurationMinutes < 1 || form.demoDurationMinutes > 180) {
      setErrorMessage('Demo duration must be between 1 and 180 minutes.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const demoSlug = createDemoSlug(selectedCategory.slug)

      const { error: categoryError } = await supabase
        .from('exam_categories')
        .update({
          demo_enabled: form.demoEnabled,
          demo_exam_id: form.demoExamId || null,
          demo_question_limit: form.demoQuestionLimit,
          demo_duration_minutes: form.demoDurationMinutes,
          show_demo_explanations: form.showDemoExplanations,
          show_register_cta: form.showRegisterCta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedCategory.id)

      if (categoryError) {
        throw new Error(categoryError.message)
      }

      if (form.demoExamId && selectedExam) {
        const { error: examError } = await supabase
          .from('exams')
          .update({
            category_id: selectedCategory.id,
            category_slug: selectedCategory.slug,
            is_demo: true,
            is_free_demo: true,
            demo_slug: demoSlug,
            total_time_minutes: form.demoDurationMinutes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', form.demoExamId)

        if (examError) {
          throw new Error(examError.message)
        }
      }

      setSuccessMessage('Demo settings saved successfully.')
      await loadData()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save demo settings.'

      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <p className="eyebrow">Admin Demo Settings</p>

          <h1>Loading demo settings...</h1>

          <p>Please wait while TestBridge loads active categories and approved tests.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Demo Settings</p>

          <h1>Configure public demo tests without login</h1>

          <p>
            Select which active category should show a public demo, choose the
            approved demo test, control question count, duration, explanations,
            and registration call-to-action.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadData()}
          >
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </section>

      {errorMessage ? (
        <section className="alert-message alert-error create-exam-note">
          <AlertCircle size={18} />
          {errorMessage}
        </section>
      ) : null}

      {successMessage ? (
        <section className="alert-message alert-success create-exam-note">
          <CheckCircle2 size={18} />
          {successMessage}
        </section>
      ) : null}

      {categories.length === 0 ? (
        <section className="placeholder-card">
          <AlertCircle size={32} />
          <h2>No active categories found</h2>
          <p>
            Create or restore an active category first. Deleted and inactive
            categories are intentionally hidden from Demo Settings.
          </p>
        </section>
      ) : (
        <section className="content-grid two-column-grid">
          <article className="content-card">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Demo Configuration</p>

                <h2>Choose category and demo test</h2>

                <p>
                  Public users will see enabled demo categories on the Demo
                  page. A demo test should normally have 10 high-quality
                  questions.
                </p>
              </div>
            </div>

            <div className="create-exam-form">
              <label className="form-field">
                <span>Category</span>

                <select
                  value={form.categoryId}
                  onChange={(event) => handleCategoryChange(event.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Demo Test</span>

                <select
                  value={form.demoExamId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      demoExamId: event.target.value,
                    }))
                  }
                >
                  <option value="">Select approved test for demo</option>

                  {approvedExamsForSelectedCategory.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
              </label>

              {approvedExamsForSelectedCategory.length === 0 ? (
                <div className="alert-message alert-error create-exam-note">
                  <AlertCircle size={18} />
                  No approved tests are mapped to this category yet. Publish or
                  map an approved test before enabling public demo.
                </div>
              ) : null}

              <label className="form-field checkbox-field">
                <input
                  type="checkbox"
                  checked={form.demoEnabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      demoEnabled: event.target.checked,
                    }))
                  }
                />

                <span>Enable public demo for this category</span>
              </label>

              <label className="form-field">
                <span>Demo Question Limit</span>

                <input
                  type="number"
                  min={1}
                  max={50}
                  value={form.demoQuestionLimit}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      demoQuestionLimit: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <label className="form-field">
                <span>Demo Duration Minutes</span>

                <input
                  type="number"
                  min={1}
                  max={180}
                  value={form.demoDurationMinutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      demoDurationMinutes: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <label className="form-field checkbox-field">
                <input
                  type="checkbox"
                  checked={form.showDemoExplanations}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      showDemoExplanations: event.target.checked,
                    }))
                  }
                />

                <span>Show explanations after demo result</span>
              </label>

              <label className="form-field checkbox-field">
                <input
                  type="checkbox"
                  checked={form.showRegisterCta}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      showRegisterCta: event.target.checked,
                    }))
                  }
                />

                <span>Show register button after demo result</span>
              </label>

              <div className="hero-actions">
                <button
                  type="button"
                  className="primary-button"
                  disabled={isSaving}
                  onClick={() => void handleSave()}
                >
                  <Save size={18} />
                  {isSaving ? 'Saving...' : 'Save Demo Settings'}
                </button>
              </div>
            </div>
          </article>

          <article className="content-card">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Public Demo Preview</p>

                <h2>What visitors will experience</h2>

                <p>
                  This preview explains how the selected demo category will
                  appear to visitors without login.
                </p>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <Sparkles size={34} />

                <h2>{selectedCategory?.name || 'Select Category'}</h2>

                <p>
                  {selectedCategory?.description ||
                    'Choose a category to configure public demo access.'}
                </p>
              </div>

              <div className="dashboard-card">
                <Settings size={34} />

                <h2>Demo Rules</h2>

                <p>
                  {form.demoEnabled ? 'Demo is enabled.' : 'Demo is disabled.'}
                </p>

                <div className="flow-list">
                  <div className="flow-item">
                    <strong>Questions</strong>
                    <span>{form.demoQuestionLimit}</span>
                  </div>

                  <div className="flow-item">
                    <strong>Duration</strong>
                    <span>{form.demoDurationMinutes} minutes</span>
                  </div>

                  <div className="flow-item">
                    <strong>Explanations</strong>
                    <span>{form.showDemoExplanations ? 'Visible' : 'Hidden'}</span>
                  </div>

                  <div className="flow-item">
                    <strong>Register CTA</strong>
                    <span>{form.showRegisterCta ? 'Visible' : 'Hidden'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="alert-message alert-success create-exam-note">
              <Eye size={18} />
              Public demo URL will be:
              <strong>{publicDemoUrl}</strong>
            </div>

            <div className="alert-message alert-error create-exam-note">
              <strong>Important:</strong>
              Public demo works only when the selected demo test is approved,
              mapped to this category, and has questions. Guest access also
              requires the public demo RLS SQL from Step 83A.
            </div>
          </article>
        </section>
      )}
    </main>
  )
}

export default AdminDemoSettingsPage
