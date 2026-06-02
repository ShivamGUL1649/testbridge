import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
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
  if (status === 'APPROVED') return <CheckCircle2 size={18} />
  if (status === 'REJECTED') return <XCircle size={18} />
  if (status === 'PENDING_APPROVAL') return <Clock size={18} />
  return <Edit3 size={18} />
}

function getStatusLabel(status: ExamStatus): string {
  if (status === 'PENDING_APPROVAL') return 'Pending Approval'
  return status.charAt(0) + status.slice(1).toLowerCase()
}

function getStatusClass(status: ExamStatus): string {
  if (status === 'APPROVED') return 'status-pill status-approved'
  if (status === 'REJECTED') return 'status-pill status-rejected'
  if (status === 'PENDING_APPROVAL') return 'status-pill status-pending'
  return 'status-pill status-draft'
}

function AdminPendingExamsPage() {
  const [tests, setTests] = useState<AdminExam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionTestId, setActionTestId] = useState<string | null>(null)
  const [deleteTestId, setDeleteTestId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function loadTests() {
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
        setTests([])
        return
      }

      setTests((data ?? []) as unknown as AdminExam[])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load tests.'

      setErrorMessage(message)
      setTests([])
    } finally {
      setIsLoading(false)
    }
  }

  async function updateTestStatus(testId: string, status: ExamStatus) {
    setActionTestId(testId)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('exams')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', testId)

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage(
        status === 'APPROVED'
          ? 'Test approved successfully.'
          : 'Test rejected successfully.',
      )

      await loadTests()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update test status.'

      setErrorMessage(message)
    } finally {
      setActionTestId(null)
    }
  }

  async function deleteTest(test: AdminExam) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${test.title}"?\n\nThis will permanently delete the test and its questions.`,
    )

    if (!confirmed) return

    setDeleteTestId(test.id)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase.from('exams').delete().eq('id', test.id)

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage('Test deleted successfully.')
      await loadTests()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete test.'

      setErrorMessage(message)
    } finally {
      setDeleteTestId(null)
    }
  }

  useEffect(() => {
    void loadTests()
  }, [])

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <Loader2 size={34} className="spin-icon" />
          <h1>Loading Tests</h1>
          <p>Please wait while we fetch tests submitted by Test Creators.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin Review Center</p>
          <h1>Manage Tests</h1>
          <p>
            Review tests created by Test Creators. You can edit questions,
            approve, reject, or delete tests.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadTests()}
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

      {tests.length === 0 ? (
        <section className="placeholder-card">
          <ShieldCheck size={42} />
          <h2>No tests available</h2>
          <p>Tests created by Test Creators will appear here.</p>
        </section>
      ) : (
        <section className="card-grid">
          {tests.map((test) => {
            const isActionRunning = actionTestId === test.id
            const isDeleting = deleteTestId === test.id

            return (
              <article className="exam-card" key={test.id}>
                <div className="exam-card-header">
                  <div>
                    <h2>{test.title}</h2>
                    <p>{test.description || 'No description added.'}</p>
                  </div>

                  <span className={getStatusClass(test.status)}>
                    {getStatusIcon(test.status)}
                    {getStatusLabel(test.status)}
                  </span>
                </div>

                <div className="exam-meta-grid">
                  <div>
                    <span>Created By</span>
                    <strong>{test.profiles?.name ?? 'Test Creator'}</strong>
                  </div>

                  <div>
                    <span>Creator Email</span>
                    <strong>{test.profiles?.email ?? 'Not available'}</strong>
                  </div>

                  <div>
                    <span>Total Time</span>
                    <strong>{test.total_time_minutes} minutes</strong>
                  </div>

                  <div>
                    <span>Passing Percentage</span>
                    <strong>{test.passing_marks}%</strong>
                  </div>

                  <div>
                    <span>Created On</span>
                    <strong>
                      {new Date(test.created_at).toLocaleDateString()}
                    </strong>
                  </div>
                </div>

                <div className="exam-card-actions">
                  <Link
                    to={`/admin/exam/${test.id}/questions`}
                    className="secondary-button"
                  >
                    <Edit3 size={18} />
                    Edit Test
                  </Link>

                  {test.status !== 'APPROVED' ? (
                    <button
                      type="button"
                      className="primary-button"
                      disabled={isActionRunning || isDeleting}
                      onClick={() => void updateTestStatus(test.id, 'APPROVED')}
                    >
                      {isActionRunning ? (
                        <Loader2 size={18} className="spin-icon" />
                      ) : (
                        <CheckCircle2 size={18} />
                      )}
                      Approve
                    </button>
                  ) : null}

                  {test.status !== 'REJECTED' ? (
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={isActionRunning || isDeleting}
                      onClick={() => void updateTestStatus(test.id, 'REJECTED')}
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
                    disabled={isActionRunning || isDeleting}
                    onClick={() => void deleteTest(test)}
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

export default AdminPendingExamsPage