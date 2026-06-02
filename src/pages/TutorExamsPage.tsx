import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  FilePlus2,
  Loader2,
  RefreshCcw,
  Send,
  Trash2,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type TutorExamsPageProps = {
  profile: UserProfile
}

type ExamStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

type TutorExam = {
  id: string
  title: string
  description: string | null
  total_time_minutes: number
  passing_marks: number
  status: ExamStatus
  created_by: string
  created_at: string
  updated_at: string | null
}

function getStatusIcon(status: ExamStatus): ReactNode {
  if (status === 'APPROVED') {
    return <CheckCircle2 size={18} />
  }

  if (status === 'PENDING_APPROVAL') {
    return <Clock size={18} />
  }

  if (status === 'REJECTED') {
    return <AlertCircle size={18} />
  }

  return <Edit3 size={18} />
}

function getStatusLabel(status: ExamStatus): string {
  if (status === 'PENDING_APPROVAL') {
    return 'Pending Approval'
  }

  return status.charAt(0) + status.slice(1).toLowerCase()
}

function getStatusClass(status: ExamStatus): string {
  if (status === 'APPROVED') {
    return 'status-pill status-approved'
  }

  if (status === 'PENDING_APPROVAL') {
    return 'status-pill status-pending'
  }

  if (status === 'REJECTED') {
    return 'status-pill status-rejected'
  }

  return 'status-pill status-draft'
}

function TutorExamsPage({ profile }: TutorExamsPageProps) {
  const [exams, setExams] = useState<TutorExam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishingId, setIsPublishingId] = useState<string | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadTutorExams() {
    if (!profile?.id) {
      setErrorMessage('Test Creator profile is missing. Please logout and login again.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { data, error } = await supabase
        .from('exams')
        .select(
          'id, title, description, total_time_minutes, passing_marks, status, created_by, created_at, updated_at',
        )
        .eq('created_by', profile.id)
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage(error.message)
        setExams([])
        return
      }

      setExams((data ?? []) as TutorExam[])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load tests.'

      setErrorMessage(message)
      setExams([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePublishForApproval(examId: string) {
    setIsPublishingId(examId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('exams')
        .update({
          status: 'PENDING_APPROVAL',
          updated_at: new Date().toISOString(),
        })
        .eq('id', examId)
        .eq('created_by', profile.id)

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage('Test published for admin approval.')
      await loadTutorExams()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to publish test for approval.'

      setErrorMessage(message)
    } finally {
      setIsPublishingId(null)
    }
  }

  async function handleDeleteExam(exam: TutorExam) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${exam.title}"?\n\nThis will permanently delete the test and its questions.`,
    )

    if (!confirmed) {
      return
    }

    setIsDeletingId(exam.id)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', exam.id)
        .eq('created_by', profile.id)

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage('Test deleted successfully.')
      await loadTutorExams()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete test.'

      setErrorMessage(message)
    } finally {
      setIsDeletingId(null)
    }
  }

  useEffect(() => {
    void loadTutorExams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <Loader2 size={34} className="spin-icon" />
          <h1>Loading My Tests</h1>
          <p>Please wait while we fetch your tests.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Test Creator Workspace</p>
          <h1>My Tests</h1>
          <p>
            Manage only tests created by you. You can edit questions, publish,
            or delete your own tests.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadTutorExams()}
          >
            <RefreshCcw size={18} />
            Refresh
          </button>

          <Link to="/tutor/exam/create" className="primary-button">
            <FilePlus2 size={18} />
            Create New Test
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="alert-message alert-success">{successMessage}</div>
      ) : null}

      {exams.length === 0 ? (
        <section className="placeholder-card">
          <BookOpen size={42} />
          <h2>No tests created yet</h2>
          <p>Create your first test and add questions for test takers.</p>

          <Link to="/tutor/exam/create" className="primary-button">
            <FilePlus2 size={18} />
            Create New Test
          </Link>
        </section>
      ) : (
        <section className="card-grid">
          {exams.map((exam) => {
            const canPublish =
              exam.status === 'DRAFT' || exam.status === 'REJECTED'

            const isPublishing = isPublishingId === exam.id
            const isDeleting = isDeletingId === exam.id

            return (
              <article className="exam-card" key={exam.id}>
                <div className="exam-card-header">
                  <div>
                    <h2>{exam.title}</h2>
                    <p>{exam.description || 'No description added.'}</p>
                  </div>

                  <span className={getStatusClass(exam.status)}>
                    {getStatusIcon(exam.status)}
                    {getStatusLabel(exam.status)}
                  </span>
                </div>

                <div className="exam-meta-grid">
                  <div>
                    <span>Total Time</span>
                    <strong>{exam.total_time_minutes} minutes</strong>
                  </div>

                  <div>
                    <span>Passing Percentage</span>
                    <strong>{exam.passing_marks}%</strong>
                  </div>

                  <div>
                    <span>Created On</span>
                    <strong>
                      {new Date(exam.created_at).toLocaleDateString()}
                    </strong>
                  </div>
                </div>

                <div className="exam-card-actions">
                  <Link
                    to={`/tutor/exam/${exam.id}/questions`}
                    className="secondary-button"
                  >
                    <Edit3 size={18} />
                    Edit Test
                  </Link>

                  {canPublish ? (
                    <button
                      type="button"
                      className="primary-button"
                      disabled={isPublishing || isDeleting}
                      onClick={() => void handlePublishForApproval(exam.id)}
                    >
                      {isPublishing ? (
                        <Loader2 size={18} className="spin-icon" />
                      ) : (
                        <Send size={18} />
                      )}
                      {isPublishing ? 'Publishing...' : 'Publish for Approval'}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="danger-button"
                    disabled={isPublishing || isDeleting}
                    onClick={() => void handleDeleteExam(exam)}
                  >
                    {isDeleting ? (
                      <Loader2 size={18} className="spin-icon" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default TutorExamsPage