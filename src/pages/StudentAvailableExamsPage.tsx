import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Timer,
  Trophy,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type StudentAvailableExamsPageProps = {
  profile: UserProfile
}

type ApprovedExam = {
  id: string
  title: string
  description: string | null
  total_time_minutes: number
  passing_marks: number
  status: string
  created_by: string
  created_at: string
}

type ExamAttemptSummary = {
  exam_id: string
  score: number
  total_marks: number
  passed: boolean
  submitted_at: string | null
}

type AttemptMap = Record<
  string,
  {
    totalAttempts: number
    latestAttempt: ExamAttemptSummary | null
    bestScore: number
    hasPassed: boolean
  }
>

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

function buildAttemptMap(attempts: ExamAttemptSummary[]): AttemptMap {
  return attempts.reduce<AttemptMap>((accumulator, attempt) => {
    const existing = accumulator[attempt.exam_id]

    if (!existing) {
      accumulator[attempt.exam_id] = {
        totalAttempts: 1,
        latestAttempt: attempt,
        bestScore: attempt.score,
        hasPassed: attempt.passed,
      }

      return accumulator
    }

    const existingLatestTime = existing.latestAttempt?.submitted_at
      ? new Date(existing.latestAttempt.submitted_at).getTime()
      : 0

    const currentTime = attempt.submitted_at
      ? new Date(attempt.submitted_at).getTime()
      : 0

    accumulator[attempt.exam_id] = {
      totalAttempts: existing.totalAttempts + 1,
      latestAttempt:
        currentTime >= existingLatestTime ? attempt : existing.latestAttempt,
      bestScore: Math.max(existing.bestScore, attempt.score),
      hasPassed: existing.hasPassed || attempt.passed,
    }

    return accumulator
  }, {})
}

function StudentAvailableExamsPage({
  profile,
}: StudentAvailableExamsPageProps) {
  const [exams, setExams] = useState<ApprovedExam[]>([])
  const [attemptMap, setAttemptMap] = useState<AttemptMap>({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadApprovedExams() {
    if (!profile?.id) {
      setErrorMessage('Student profile is missing. Please logout and login again.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const examsResponse = await withTimeout(
        supabase
          .from('exams')
          .select(
            'id, title, description, total_time_minutes, passing_marks, status, created_by, created_at',
          )
          .eq('status', 'APPROVED')
          .order('created_at', { ascending: false }),
        10000,
        'Approved exams loading timed out. Please check Supabase connection or RLS policy.',
      )

      if (examsResponse.error) {
        setErrorMessage(examsResponse.error.message)
        setExams([])
        setAttemptMap({})
        return
      }

      const attemptsResponse = await withTimeout(
        supabase
          .from('exam_attempts')
          .select('exam_id, score, total_marks, passed, submitted_at')
          .eq('student_id', profile.id)
          .order('submitted_at', { ascending: false }),
        10000,
        'Student attempt history loading timed out.',
      )

      if (attemptsResponse.error) {
        setErrorMessage(attemptsResponse.error.message)
        setExams((examsResponse.data ?? []) as ApprovedExam[])
        setAttemptMap({})
        return
      }

      setExams((examsResponse.data ?? []) as ApprovedExam[])
      setAttemptMap(
        buildAttemptMap(
          (attemptsResponse.data ?? []) as ExamAttemptSummary[],
        ),
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load available exams.'

      setErrorMessage(message)
      setExams([])
      setAttemptMap({})
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadApprovedExams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.id])

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <Loader2 size={34} className="spin-icon" />
          <h1>Loading Available Exams</h1>
          <p>Please wait while we fetch approved exams.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Student Workspace</p>
          <h1>Available Exams</h1>
          <p>
            All admin-approved exams are visible here. Your result is calculated
            only for your own attempt and does not affect other students.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadApprovedExams()}
          >
            <RefreshCcw size={18} />
            Refresh
          </button>
        </div>
      </section>

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      {exams.length === 0 ? (
        <section className="placeholder-card">
          <ClipboardList size={42} />
          <h2>No approved exams available</h2>
          <p>
            Exams will appear here only after an admin approves exams published
            by tutors.
          </p>
        </section>
      ) : (
        <section className="card-grid">
          {exams.map((exam) => {
            const studentAttempt = attemptMap[exam.id]
            const hasAttempted = Boolean(studentAttempt)

            return (
              <article className="exam-card" key={exam.id}>
                <div className="exam-card-header">
                  <div>
                    <h2>{exam.title}</h2>
                    <p>{exam.description || 'No description added.'}</p>
                  </div>

                  <span className="status-pill status-approved">
                    <CheckCircle2 size={18} />
                    Approved
                  </span>
                </div>

                <div className="exam-meta-grid">
                  <div>
                    <span>Total Time</span>
                    <strong>
                      <Timer size={16} />
                      {exam.total_time_minutes} minutes
                    </strong>
                  </div>

                  <div>
                    <span>Passing Marks</span>
                    <strong>
                      <Trophy size={16} />
                      {exam.passing_marks}
                    </strong>
                  </div>

                  <div>
                    <span>Your Status</span>
                    <strong>
                      {hasAttempted
                        ? studentAttempt?.hasPassed
                          ? 'Passed'
                          : 'Attempted'
                        : 'Not Attempted'}
                    </strong>
                  </div>
                </div>

                {hasAttempted ? (
                  <div className="alert-message alert-success">
                    Your attempts: {studentAttempt.totalAttempts}. Best score:{' '}
                    {studentAttempt.bestScore}. Latest result:{' '}
                    {studentAttempt.latestAttempt?.passed ? 'Pass' : 'Fail'}.
                  </div>
                ) : null}

                <div className="exam-card-actions">
                  <Link
                    to={`/student/exam/${exam.id}/attempt`}
                    className="primary-button"
                  >
                    {hasAttempted ? (
                      <>
                        <RotateCcw size={18} />
                        Attempt Again
                      </>
                    ) : (
                      <>
                        <BookOpen size={18} />
                        Start Exam
                      </>
                    )}
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

export default StudentAvailableExamsPage