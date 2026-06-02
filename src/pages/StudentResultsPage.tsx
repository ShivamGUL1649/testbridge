import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  CheckCircle2,
  Eye,
  Loader2,
  RefreshCcw,
  Trophy,
  XCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type StudentResultsPageProps = {
  profile: UserProfile
}

type ExamAttemptResult = {
  id: string
  exam_id: string
  student_id: string
  started_at: string
  submitted_at: string | null
  expires_at: string
  score: number
  total_marks: number
  passed: boolean
  answers: unknown
  exams?: {
    id: string
    title: string
    description: string | null
    passing_marks: number
  } | null
}

type LocationState = {
  message?: string
}

function getScorePercentage(score: number, totalMarks: number): number {
  if (totalMarks <= 0) return 0
  return Number(((score / totalMarks) * 100).toFixed(2))
}

function StudentResultsPage({ profile }: StudentResultsPageProps) {
  const location = useLocation()
  const state = location.state as LocationState | null

  const [results, setResults] = useState<ExamAttemptResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(state?.message ?? '')

  async function loadResults() {
    if (!profile?.id) {
      setErrorMessage('Test Taker profile is missing. Please logout and login again.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
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
            description,
            passing_marks
          )
        `,
        )
        .eq('student_id', profile.id)
        .order('submitted_at', { ascending: false })

      if (error) {
        setErrorMessage(error.message)
        setResults([])
        return
      }

      setResults((data ?? []) as unknown as ExamAttemptResult[])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load test results.'

      setErrorMessage(message)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <Loader2 size={34} className="spin-icon" />
          <h1>Loading Results</h1>
          <p>Please wait while we fetch your submitted test attempts.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Test Taker Results</p>
          <h1>My Results</h1>
          <p>
            Review your submitted test attempts, scores, percentages, and
            pass/fail status.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setSuccessMessage('')
              void loadResults()
            }}
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
        </div>
      </section>

      {successMessage ? (
        <div className="alert-message alert-success">{successMessage}</div>
      ) : null}

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      {results.length === 0 ? (
        <section className="placeholder-card">
          <BarChart3 size={42} />
          <h2>No test results yet</h2>
          <p>
            Attempt an approved test first. Your submitted results will appear
            here.
          </p>

          <Link to="/student/exams" className="primary-button">
            View Available Tests
          </Link>
        </section>
      ) : (
        <section className="card-grid">
          {results.map((result) => {
            const percentage = getScorePercentage(
              result.score,
              result.total_marks,
            )

            return (
              <article className="exam-card" key={result.id}>
                <div className="exam-card-header">
                  <div>
                    <h2>{result.exams?.title ?? 'Test Result'}</h2>
                    <p>
                      {result.exams?.description ||
                        'Submitted test attempt result.'}
                    </p>
                  </div>

                  <span
                    className={
                      result.passed
                        ? 'status-pill status-approved'
                        : 'status-pill status-rejected'
                    }
                  >
                    {result.passed ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <XCircle size={18} />
                    )}
                    {result.passed ? 'Pass' : 'Fail'}
                  </span>
                </div>

                <div className="exam-meta-grid">
                  <div>
                    <span>Score</span>
                    <strong>
                      <Trophy size={16} />
                      {result.score}/{result.total_marks}
                    </strong>
                  </div>

                  <div>
                    <span>Percentage</span>
                    <strong>{percentage}%</strong>
                  </div>

                  <div>
                    <span>Passing Percentage</span>
                    <strong>{result.exams?.passing_marks ?? 0}%</strong>
                  </div>

                  <div>
                    <span>Submitted On</span>
                    <strong>
                      {result.submitted_at
                        ? new Date(result.submitted_at).toLocaleString()
                        : 'Not submitted'}
                    </strong>
                  </div>
                </div>

                <div className="exam-card-actions">
                  <Link
                    to={`/student/results/${result.id}/review`}
                    className="primary-button"
                  >
                    <Eye size={18} />
                    Review Answers
                  </Link>

                  <Link
                    to={`/student/exam/${result.exam_id}/attempt`}
                    className="secondary-button"
                  >
                    Attempt Again
                  </Link>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}

export default StudentResultsPage