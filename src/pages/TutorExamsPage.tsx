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

function withTimeout<T>(
  request: PromiseLike<T>,
  timeoutMs: number,
  errorMessage: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(errorMessage))
    }, timeoutMs)

    Promise.resolve(request)
      .then((result) => {
        window.clearTimeout(timer)
        resolve(result)
      })
      .catch((error) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })
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
  const [errorMessage, setErrorMessage] = useState('')

  async function loadTutorExams() {
    if (!profile?.id) {
      setErrorMessage('Tutor profile is missing. Please logout and login again.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await withTimeout(
        supabase
          .from('exams')
          .select(
            'id, title, description, total_time_minutes, passing_marks, status, created_by, created_at, updated_at',
          )
          .eq('created_by', profile.id)
          .order('created_at', { ascending: false }),
        10000,
        'My Exams loading timed out. Please check Supabase connection or RLS policy.',
      )

      if (response.error) {
        setErrorMessage(response.error.message)
        setExams([])
        return
      }

      setExams((response.data ?? []) as TutorExam[])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load tutor exams.'

      setErrorMessage(message)
      setExams([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePublishForApproval(examId: string) {
    setIsPublishingId(examId)
    setErrorMessage('')

    try {
      const response = await withTimeout(
        supabase
          .from('exams')
          .update({
            status: 'PENDING_APPROVAL',
            updated_at: new Date().toISOString(),
          })
          .eq('id', examId)
          .eq('created_by', profile.id)
          .select('id')
          .single(),
        10000,
        'Publish request timed out. Please try again.',
      )

      if (response.error) {
        setErrorMessage(response.error.message)
        return
      }

      await loadTutorExams()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to publish exam for approval.'

      setErrorMessage(message)
    } finally {
      setIsPublishingId(null)
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
          <h1>Loading My Exams</h1>
          <p>Please wait while we fetch your exams.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Tutor Workspace</p>
          <h1>My Exams</h1>
          <p>
            Manage your draft exams, submit exams for admin approval, and track
            approval status.
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
            Create New Exam
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      {exams.length === 0 ? (
        <section className="placeholder-card">
          <BookOpen size={42} />
          <h2>No exams created yet</h2>
          <p>Create your first exam and add questions for students.</p>

          <Link to="/tutor/exam/create" className="primary-button">
            <FilePlus2 size={18} />
            Create New Exam
          </Link>
        </section>
      ) : (
        <section className="card-grid">
          {exams.map((exam) => {
            const canEditQuestions =
              exam.status === 'DRAFT' || exam.status === 'REJECTED'

            const canPublish =
              exam.status === 'DRAFT' || exam.status === 'REJECTED'

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
                    <span>Passing Marks</span>
                    <strong>{exam.passing_marks}</strong>
                  </div>

                  <div>
                    <span>Created On</span>
                    <strong>
                      {new Date(exam.created_at).toLocaleDateString()}
                    </strong>
                  </div>
                </div>

                <div className="exam-card-actions">
                  {canEditQuestions ? (
                    <Link
                      to={`/tutor/exam/${exam.id}/questions`}
                      className="secondary-button"
                    >
                      <Edit3 size={18} />
                      Add / Edit Questions
                    </Link>
                  ) : (
                    <Link
                      to={`/tutor/exam/${exam.id}/questions`}
                      className="secondary-button"
                    >
                      <BookOpen size={18} />
                      View Questions
                    </Link>
                  )}

                  {canPublish ? (
                    <button
                      type="button"
                      className="primary-button"
                      disabled={isPublishingId === exam.id}
                      onClick={() => void handlePublishForApproval(exam.id)}
                    >
                      {isPublishingId === exam.id ? (
                        <Loader2 size={18} className="spin-icon" />
                      ) : (
                        <Send size={18} />
                      )}
                      {isPublishingId === exam.id
                        ? 'Publishing...'
                        : 'Publish for Approval'}
                    </button>
                  ) : null}
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