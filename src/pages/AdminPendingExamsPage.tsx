import { useEffect, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'

type ExamStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

type PendingExam = {
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

type QuestionCountMap = Record<string, number>

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function AdminPendingExamsPage() {
  const [exams, setExams] = useState<PendingExam[]>([])
  const [questionCounts, setQuestionCounts] = useState<QuestionCountMap>({})
  const [isLoading, setIsLoading] = useState(true)
  const [actionExamId, setActionExamId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadPendingExams() {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const { data, error } = await supabase
      .from('exams')
      .select(
        'id, title, description, total_time_minutes, passing_marks, status, created_by, created_at, updated_at',
      )
      .eq('status', 'PENDING_APPROVAL')
      .order('created_at', { ascending: false })

    if (error) {
      setExams([])
      setQuestionCounts({})
      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    const pendingExams = (data ?? []) as PendingExam[]
    setExams(pendingExams)

    if (pendingExams.length === 0) {
      setQuestionCounts({})
      setIsLoading(false)
      return
    }

    const examIds = pendingExams.map((exam) => exam.id)

    const { data: questionData, error: questionError } = await supabase
      .from('exam_questions')
      .select('id, exam_id')
      .in('exam_id', examIds)

    if (questionError) {
      setQuestionCounts({})
      setErrorMessage(questionError.message)
      setIsLoading(false)
      return
    }

    const counts = (questionData ?? []).reduce<QuestionCountMap>(
      (currentCounts, question) => {
        const examId = String(question.exam_id)
        currentCounts[examId] = (currentCounts[examId] ?? 0) + 1
        return currentCounts
      },
      {},
    )

    setQuestionCounts(counts)
    setIsLoading(false)
  }

  useEffect(() => {
    void loadPendingExams()
  }, [])

  async function updateExamStatus(exam: PendingExam, status: 'APPROVED' | 'REJECTED') {
    const questionCount = questionCounts[exam.id] ?? 0

    if (status === 'APPROVED' && questionCount === 0) {
      setErrorMessage('Exam cannot be approved because no questions are added.')
      setSuccessMessage('')
      return
    }

    const updatedAt = new Date().toISOString()

    setActionExamId(exam.id)
    setErrorMessage('')
    setSuccessMessage('')

    const { error } = await supabase
      .from('exams')
      .update({
        status,
        updated_at: updatedAt,
      })
      .eq('id', exam.id)
      .eq('status', 'PENDING_APPROVAL')

    if (error) {
      setErrorMessage(error.message)
      setActionExamId(null)
      return
    }

    setExams((currentExams) =>
      currentExams.filter((currentExam) => currentExam.id !== exam.id),
    )

    setSuccessMessage(
      status === 'APPROVED'
        ? 'Exam approved successfully. Students can now see this exam.'
        : 'Exam rejected successfully. Tutor can update and publish again.',
    )

    setActionExamId(null)
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Approval Center</p>
          <h1>Pending Exam Approvals</h1>
          <p>
            Review tutor-published exams before making them available to
            students. Only approved exams are visible to students.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => void loadPendingExams()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 size={17} className="spin-icon" />
          ) : (
            <RefreshCcw size={17} />
          )}
          Refresh
        </button>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Pending Exams</span>
          <strong>{exams.length}</strong>
        </article>

        <article className="stat-card">
          <span>Approval Rule</span>
          <strong>Admin</strong>
        </article>

        <article className="stat-card">
          <span>Student Visibility</span>
          <strong>Approved</strong>
        </article>
      </section>

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="alert-message alert-success">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      ) : null}

      <section className="content-card">
        <div className="section-title-row">
          <div>
            <h2>Review Queue</h2>
            <p>
              Approving an exam changes its status to APPROVED. Rejecting it
              sends it back to the tutor for correction.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="inline-loading">
            <Loader2 size={22} className="spin-icon" />
            Loading pending exams...
          </div>
        ) : exams.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck size={44} />
            <h3>No pending exams</h3>
            <p>
              There are no tutor-published exams waiting for approval right now.
            </p>
          </div>
        ) : (
          <div className="exam-list">
            {exams.map((exam) => {
              const questionCount = questionCounts[exam.id] ?? 0
              const isActionRunning = actionExamId === exam.id

              return (
                <article key={exam.id} className="exam-card">
                  <div className="exam-card-main">
                    <div className="exam-icon">
                      <BookOpen size={22} />
                    </div>

                    <div>
                      <div className="exam-title-row">
                        <h3>{exam.title}</h3>

                        <span className="status-pill status-pending">
                          <Clock size={15} />
                          Pending Approval
                        </span>
                      </div>

                      <p className="exam-description">
                        {exam.description?.trim()
                          ? exam.description
                          : 'No description added.'}
                      </p>

                      <div className="exam-meta">
                        <span>{exam.total_time_minutes} minutes</span>
                        <span>Passing marks: {exam.passing_marks}</span>
                        <span>{questionCount} questions</span>
                        <span>Created: {formatDate(exam.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="exam-actions">
                    <button
                      type="button"
                      className="danger-button"
                      disabled={isActionRunning}
                      onClick={() => void updateExamStatus(exam, 'REJECTED')}
                    >
                      {isActionRunning ? (
                        <Loader2 size={16} className="spin-icon" />
                      ) : (
                        <XCircle size={16} />
                      )}
                      Reject
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      disabled={isActionRunning || questionCount === 0}
                      onClick={() => void updateExamStatus(exam, 'APPROVED')}
                    >
                      {isActionRunning ? (
                        <Loader2 size={16} className="spin-icon" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      Approve
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPendingExamsPage