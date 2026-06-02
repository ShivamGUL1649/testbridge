import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  FilePlus2,
  Loader2,
  Percent,
  Timer,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type CreateExamPageProps = {
  profile: UserProfile
}

function CreateExamPage({ profile }: CreateExamPageProps) {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalTimeMinutes, setTotalTimeMinutes] = useState('30')
  const [passingPercentage, setPassingPercentage] = useState('70')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  function validateForm(): string | null {
    if (!profile?.id) {
      return 'Test Creator profile is missing. Please logout and login again.'
    }

    if (profile.role !== 'TUTOR') {
      return 'Only Test Creator users can create tests.'
    }

    if (!title.trim()) {
      return 'Test name is required.'
    }

    const timeValue = Number(totalTimeMinutes)
    const passingValue = Number(passingPercentage)

    if (!Number.isFinite(timeValue) || timeValue <= 0) {
      return 'Total time must be greater than 0 minutes.'
    }

    if (
      !Number.isFinite(passingValue) ||
      passingValue < 0 ||
      passingValue > 100
    ) {
      return 'Passing percentage must be between 0 and 100.'
    }

    return null
  }

  async function handleCreateExam(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSaving) {
      return
    }

    const validationError = validateForm()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSaving(true)
    setErrorMessage('')

    try {
      const { data, error } = await supabase
        .from('exams')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          total_time_minutes: Number(totalTimeMinutes),
          passing_marks: Number(passingPercentage),
          status: 'DRAFT',
          created_by: profile.id,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error) {
        setErrorMessage(error.message)
        return
      }

      if (!data?.id) {
        setErrorMessage('Test was not created. Please try again.')
        return
      }

      navigate(`/tutor/exam/${data.id}/questions`)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating the test.'

      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Test Creator Setup</p>
          <h1>Create New Test</h1>
          <p>
            Create the basic test details first. After saving, you will add
            questions, options, correct answers, and explanations.
          </p>
        </div>
      </section>

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>Test Details</h2>
              <p>
                New tests are saved as Draft. Test takers can see tests only
                after admin approval.
              </p>
            </div>
          </div>

          <form className="form-card" onSubmit={handleCreateExam}>
            <label className="form-field">
              <span>Test Name</span>
              <div className="input-with-icon">
                <BookOpen size={18} />
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Example: Cloud Practice Test"
                  disabled={isSaving}
                />
              </div>
            </label>

            <label className="form-field">
              <span>Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what this test is about..."
                rows={4}
                disabled={isSaving}
              />
            </label>

            <div className="form-grid">
              <label className="form-field">
                <span>Total Time Minutes</span>
                <div className="input-with-icon">
                  <Timer size={18} />
                  <input
                    type="number"
                    min="1"
                    value={totalTimeMinutes}
                    onChange={(event) =>
                      setTotalTimeMinutes(event.target.value)
                    }
                    disabled={isSaving}
                  />
                </div>
              </label>

              <label className="form-field">
                <span>Passing Percentage</span>
                <div className="input-with-icon">
                  <Percent size={18} />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={passingPercentage}
                    onChange={(event) =>
                      setPassingPercentage(event.target.value)
                    }
                    disabled={isSaving}
                  />
                </div>
              </label>
            </div>

            <button
              type="submit"
              className="primary-button full-width-button"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 size={18} className="spin-icon" />
              ) : (
                <FilePlus2 size={18} />
              )}
              {isSaving ? 'Creating Test...' : 'Create Test'}
            </button>
          </form>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>Test Workflow</h2>
              <p>
                TestBridge follows a controlled test publishing workflow.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>1. Create Draft</strong>
              <span>
                Save test title, description, timer, and passing percentage.
              </span>
            </div>

            <div className="flow-item">
              <strong>2. Add Questions</strong>
              <span>
                Add MCQ questions, options, answers, marks, and explanation.
              </span>
            </div>

            <div className="flow-item">
              <strong>3. Publish for Approval</strong>
              <span>Test Creator publishes the test for admin review.</span>
            </div>

            <div className="flow-item">
              <strong>4. Test Taker Attempt</strong>
              <span>
                Test taker passes only when score percentage is greater than or
                equal to passing percentage.
              </span>
            </div>
          </div>

          <div className="alert-message alert-success create-exam-note">
            <ClipboardList size={18} />
            Example: If passing percentage is 78%, test taker must score 78% or
            more to pass.
          </div>
        </article>
      </section>
    </main>
  )
}

export default CreateExamPage