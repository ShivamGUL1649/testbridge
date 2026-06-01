import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  BookOpen,
  CheckCircle2,
  Eye,
  Loader2,
  RefreshCcw,
  XCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type ExamAttempt = {
  id: string
  exam_id: string
  student_id: string
  started_at: string
  submitted_at: string | null
  expires_at: string
  score: number
  total_marks: number
  passed: boolean
  answers: Record<string, string>
}

type ExamDetails = {
  id: string
  title: string
  passing_marks: number
}

type ResultRow = ExamAttempt & {
  exam: ExamDetails | null
}

type StudentResultsPageProps = {
  profile: UserProfile
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not submitted'
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function StudentResultsPage({ profile }: StudentResultsPageProps) {
  const [results, setResults] = useState<ResultRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadResults() {
    setIsLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('exam_attempts')
      .select(
        `
        id,
        exam_id,
        student_id,
        started_at,
        submitted_at,
        expires_at,
        score,
        total_marks,
        passed,
        answers,
        exams (
          id,
          title,
          passing_marks
        )
      `,
      )
      .eq('student_id', profile.id)
      .order('submitted_at', { ascending: false })

    if (error) {
      setResults([])
      setErrorMessage(error.message)
      setIsLoading(false)
      return
    }

    const mappedResults = (data ?? []).map((item) => {
      const examData = Array.isArray(item.exams)
        ? item.exams[0]
        : item.exams

      return {
        id: item.id,
        exam_id: item.exam_id,
        student_id: item.student_id,
        started_at: item.started_at,
        submitted_at: item.submitted_at,
        expires_at: item.expires_at,
        score: item.score,
        total_marks: item.total_marks,
        passed: item.passed,
        answers: item.answers ?? {},
        exam: examData
          ? {
              id: examData.id,
              title: examData.title,
              passing_marks: examData.passing_marks,
            }
          : null,
      } as ResultRow
    })

    setResults(mappedResults)
    setIsLoading(false)
  }

  useEffect(() => {
    void loadResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  const passedCount = results.filter((result) => result.passed).length
  const failedCount = results.filter((result) => !result.passed).length

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Student Result Center</p>
          <h1>My Results</h1>
          <p>
            View submitted exam results. Detailed answer review and explanations
            will be connected in the next step.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => void loadResults()}
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
          <span>Total Attempts</span>
          <strong>{results.length}</strong>
        </article>

        <article className="stat-card">
          <span>Passed</span>
          <strong>{passedCount}</strong>
        </article>

        <article className="stat-card">
          <span>Failed</span>
          <strong>{failedCount}</strong>
        </article>
      </section>

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      <section className="content-card">
        <div className="section-title-row">
          <div>
            <h2>Submitted Attempts</h2>
            <p>
              Each attempt has a unique attempt id, so parallel students do not
              conflict with each other.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="inline-loading">
            <Loader2 size={22} className="spin-icon" />
            Loading results...
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={44} />
            <h3>No results found</h3>
            <p>After submitting an exam, your result will appear here.</p>
            <Link to="/student/exams" className="primary-button">
              View Available Exams
            </Link>
          </div>
        ) : (
          <div className="exam-list">
            {results.map((result) => {
              const percentage =
                result.total_marks > 0
                  ? Math.round((result.score / result.total_marks) * 100)
                  : 0

              return (
                <article key={result.id} className="exam-card">
                  <div className="exam-card-main">
                    <div className="exam-icon">
                      <Award size={22} />
                    </div>

                    <div>
                      <div className="exam-title-row">
                        <h3>{result.exam?.title ?? 'Exam'}</h3>

                        <span
                          className={
                            result.passed
                              ? 'status-pill status-approved'
                              : 'status-pill status-rejected'
                          }
                        >
                          {result.passed ? (
                            <CheckCircle2 size={15} />
                          ) : (
                            <XCircle size={15} />
                          )}
                          {result.passed ? 'Passed' : 'Failed'}
                        </span>
                      </div>

                      <p className="exam-description">
                        Attempt ID: <strong>{result.id}</strong>
                      </p>

                      <div className="exam-meta">
                        <span>
                          Score: {result.score}/{result.total_marks}
                        </span>
                        <span>{percentage}%</span>
                        <span>
                          Passing Marks:{' '}
                          {result.exam?.passing_marks ?? 'Not available'}
                        </span>
                        <span>
                          Submitted: {formatDateTime(result.submitted_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="exam-actions">
                    <Link
                      to={`/student/results/${result.id}/review`}
                      className="secondary-button"
                    >
                      <Eye size={16} />
                      Review
                    </Link>
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

export default StudentResultsPage