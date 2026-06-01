import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'

type ExamStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

type AdminExam = {
  id: string
  title: string
  description: string | null
  total_time_minutes: number
  passing_marks: number
  status: ExamStatus
  created_by: string
  created_at: string
  updated_at: string | null
  profiles?: {
    name: string
    email: string
  } | null
}

function getStatusIcon(status: ExamStatus): ReactNode {
  if (status === 'APPROVED') {
    return <CheckCircle2 size={18} />
  }

  if (status === 'PENDING_APPROVAL') {
    return <Clock size={18} />
  }

  if (status === 'REJECTED') {
    return <XCircle size={18} />
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

function AdminPendingExamsPage() {
  const [exams, setExams] = useState<AdminExam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionExamId, setActionExamId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadAllExams() {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { data, error } = await supabase
        .from('exams')
        .select(
          `
          id,
          title,
          description,
          total_time_minutes,
          passing_marks,
          status,
          created_by,
          created_at,
          updated_at,
          profiles (
            name,
            email
          )
        `,
        )
        .order('created_at', { ascending: false })

      if (error) {
        setErrorMessage(error.message)
        setExams([])
        return
      }

      setExams((data ?? []) as unknown as AdminExam[])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load exams.'

      setErrorMessage(message)
      setExams([])
    } finally {
      setIsLoading(false)
    }
  }

  async function updateExamStatus(examId: string, status: ExamStatus) {
    setActionExamId(examId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('exams')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', examId)

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage(`Exam status updated to ${getStatusLabel(status)}.`)
      await loadAllExams()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update exam status.'

      setErrorMessage(message)
    } finally {
      setActionExamId(null)
    }
  }

  async function handleDeleteExam(exam: AdminExam) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${exam.title}"?\n\nAdmin delete will permanently remove this exam and its questions.`,
    )

    if (!confirmed) {
      return
    }

    setActionExamId(exam.id)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase.from('exams').delete().eq('id', exam.id)

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage('Exam deleted successfully.')
      await loadAllExams()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete exam.'

      setErrorMessage(message)
    } finally {
      setActionExamId(null)
    }
  }

  useEffect(() => {
    void loadAllExams()
  }, [])

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <Loader2 size={34} className="spin-icon" />
          <h1>Loading Exams</h1>
          <p>Please wait while we fetch all exams for admin review.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Control Panel</p>
          <h1>Manage All Exams</h1>
          <p>
            Admin can approve, reject, edit, or delete any test created by any
            tutor.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadAllExams()}
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
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
          <h2>No exams found</h2>
          <p>Once tutors create exams, they will appear here.</p>
        </section>
      ) : (
        <section className="card-grid">
          {exams.map((exam) => {
            const isActionRunning = actionExamId === exam.id

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
                    <span>Tutor</span>
                    <strong>{exam.profiles?.name || 'Unknown Tutor'}</strong>
                  </div>

                  <div>
                    <span>Tutor Email</span>
                    <strong>{exam.profiles?.email || 'Not available'}</strong>
                  </div>

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
                    to={`/admin/exam/${exam.id}/questions`}
                    className="secondary-button"
                  >
                    <Edit3 size={18} />
                    Edit Test
                  </Link>

                  {exam.status !== 'APPROVED' ? (
                    <button
                      type="button"
                      className="primary-button"
                      disabled={isActionRunning}
                      onClick={() => void updateExamStatus(exam.id, 'APPROVED')}
                    >
                      {isActionRunning ? (
                        <Loader2 size={18} className="spin-icon" />
                      ) : (
                        <ShieldCheck size={18} />
                      )}
                      Approve
                    </button>
                  ) : null}

                  {exam.status !== 'REJECTED' ? (
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={isActionRunning}
                      onClick={() => void updateExamStatus(exam.id, 'REJECTED')}
                    >
                      {isActionRunning ? (
                        <Loader2 size={18} className="spin-icon" />
                      ) : (
                        <AlertCircle size={18} />
                      )}
                      Reject
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="danger-button"
                    disabled={isActionRunning}
                    onClick={() => void handleDeleteExam(exam)}
                  >
                    {isActionRunning ? (
                      <Loader2 size={18} className="spin-icon" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    Delete
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

export default AdminPendingExamsPage