import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Percent,
  Send,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type ExamAttemptPageProps = {
  profile: UserProfile
}

type OptionKey = 'A' | 'B' | 'C' | 'D'

type ExamDetails = {
  id: string
  title: string
  description: string | null
  total_time_minutes: number
  passing_marks: number
  status: string
}

type ExamQuestion = {
  id: string
  exam_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: OptionKey
  explanation: string | null
  marks: number
  question_order: number
}

type AnswerMap = Record<string, OptionKey>

type StoredAttemptState = {
  attemptId: string
  examId: string
  studentId: string
  startedAt: string
  expiresAt: string
  answers: AnswerMap
}

function getStorageKey(studentId: string, examId: string): string {
  return `testbridge-attempt-${studentId}-${examId}`
}

function createAttemptState(
  studentId: string,
  examId: string,
  totalTimeMinutes: number,
): StoredAttemptState {
  const startedAt = new Date()
  const expiresAt = new Date(
    startedAt.getTime() + totalTimeMinutes * 60 * 1000,
  )

  return {
    attemptId: crypto.randomUUID(),
    examId,
    studentId,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    answers: {},
  }
}

function formatRemainingTime(totalSeconds: number): string {
  const safeSeconds = Math.max(totalSeconds, 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`
}

function normalizeOption(option: string | null | undefined): OptionKey | null {
  const value = String(option ?? '').trim().toUpperCase()

  if (value === 'A' || value === 'B' || value === 'C' || value === 'D') {
    return value
  }

  return null
}

function ExamAttemptPage({ profile }: ExamAttemptPageProps) {
  const { examId } = useParams()
  const navigate = useNavigate()

  const [exam, setExam] = useState<ExamDetails | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [attemptState, setAttemptState] = useState<StoredAttemptState | null>(
    null,
  )
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const answeredCount = useMemo(() => {
    return Object.keys(attemptState?.answers ?? {}).length
  }, [attemptState])

  const totalMarks = useMemo(() => {
    return questions.reduce((total, question) => total + question.marks, 0)
  }, [questions])

  async function loadExamForAttempt() {
    if (!examId) {
      setErrorMessage('Exam ID is missing.')
      setIsLoading(false)
      return
    }

    if (!profile?.id) {
      setErrorMessage('Student profile is missing. Please logout and login again.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const examResponse = await supabase
        .from('exams')
        .select(
          'id, title, description, total_time_minutes, passing_marks, status',
        )
        .eq('id', examId)
        .eq('status', 'APPROVED')
        .single()

      if (examResponse.error) {
        setErrorMessage(examResponse.error.message)
        setExam(null)
        setQuestions([])
        return
      }

      const questionsResponse = await supabase
        .from('exam_questions')
        .select(
          'id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, marks, question_order',
        )
        .eq('exam_id', examId)
        .order('question_order', { ascending: true })

      if (questionsResponse.error) {
        setErrorMessage(questionsResponse.error.message)
        setExam(examResponse.data as ExamDetails)
        setQuestions([])
        return
      }

      const loadedExam = examResponse.data as ExamDetails
      const loadedQuestions = ((questionsResponse.data ?? []) as ExamQuestion[]).map(
        (question) => ({
          ...question,
          correct_option:
            normalizeOption(question.correct_option) ?? question.correct_option,
        }),
      )

      setExam(loadedExam)
      setQuestions(loadedQuestions)

      const storageKey = getStorageKey(profile.id, examId)
      const savedAttemptText = window.localStorage.getItem(storageKey)

      if (savedAttemptText) {
        const savedAttempt = JSON.parse(savedAttemptText) as StoredAttemptState

        if (
          savedAttempt.studentId === profile.id &&
          savedAttempt.examId === examId &&
          new Date(savedAttempt.expiresAt).getTime() > Date.now()
        ) {
          setAttemptState(savedAttempt)
          return
        }

        window.localStorage.removeItem(storageKey)
      }

      const newAttempt = createAttemptState(
        profile.id,
        examId,
        loadedExam.total_time_minutes,
      )

      window.localStorage.setItem(storageKey, JSON.stringify(newAttempt))
      setAttemptState(newAttempt)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load exam attempt.'

      setErrorMessage(message)
      setExam(null)
      setQuestions([])
    } finally {
      setIsLoading(false)
    }
  }

  function updateAnswer(questionId: string, selectedOption: OptionKey) {
    if (!attemptState || !examId) {
      return
    }

    const updatedAttempt: StoredAttemptState = {
      ...attemptState,
      answers: {
        ...attemptState.answers,
        [questionId]: selectedOption,
      },
    }

    setAttemptState(updatedAttempt)
    window.localStorage.setItem(
      getStorageKey(profile.id, examId),
      JSON.stringify(updatedAttempt),
    )
  }

  async function submitAttempt(isAutoSubmit = false) {
    if (!examId || !exam || !attemptState) {
      setErrorMessage('Attempt details are missing.')
      return
    }

    if (questions.length === 0) {
      setErrorMessage('No questions are available for this exam.')
      return
    }

    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      let score = 0

      const answerDetails = questions.map((question) => {
        const selectedOption =
          normalizeOption(attemptState.answers[question.id]) ?? null

        const correctOption = normalizeOption(question.correct_option)
        const isCorrect =
          selectedOption !== null &&
          correctOption !== null &&
          selectedOption === correctOption

        const earnedMarks = isCorrect ? question.marks : 0

        score += earnedMarks

        return {
          question_id: question.id,
          selected_option: selectedOption,
          correct_option: correctOption,
          is_correct: isCorrect,
          marks: question.marks,
          earned_marks: earnedMarks,
        }
      })

      const scorePercentage =
        totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0

      const passingPercentage = Number(exam.passing_marks)
      const passed = scorePercentage >= passingPercentage

      const submittedAt = new Date().toISOString()

      const response = await supabase.from('exam_attempts').insert({
        id: attemptState.attemptId,
        exam_id: exam.id,
        student_id: profile.id,
        started_at: attemptState.startedAt,
        submitted_at: submittedAt,
        expires_at: attemptState.expiresAt,
        score,
        total_marks: totalMarks,
        passed,
        answers: {
          passing_percentage: passingPercentage,
          score_percentage: scorePercentage,
          total_questions: questions.length,
          answered_questions: answeredCount,
          answer_details: answerDetails,
        },
      })

      if (response.error) {
        setErrorMessage(response.error.message)
        return
      }

      window.localStorage.removeItem(getStorageKey(profile.id, examId))

      navigate('/student/results', {
        replace: true,
        state: {
          message: isAutoSubmit
            ? 'Exam time completed. Your attempt was auto-submitted.'
            : 'Exam submitted successfully.',
        },
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to submit exam attempt.'

      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    void loadExamForAttempt()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, profile.id])

  useEffect(() => {
    if (!attemptState) {
      return
    }

    const updateRemainingTime = () => {
      const expiresAtTime = new Date(attemptState.expiresAt).getTime()
      const secondsLeft = Math.max(
        Math.floor((expiresAtTime - Date.now()) / 1000),
        0,
      )

      setRemainingSeconds(secondsLeft)

      if (secondsLeft <= 0) {
        void submitAttempt(true)
      }
    }

    updateRemainingTime()

    const timer = window.setInterval(updateRemainingTime, 1000)

    return () => {
      window.clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptState])

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <Loader2 size={34} className="spin-icon" />
          <h1>Loading Exam</h1>
          <p>Please wait while we prepare your independent attempt.</p>
        </section>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main className="page-shell">
        <section className="placeholder-card error-card">
          <AlertTriangle size={42} />
          <h1>Unable to Start Exam</h1>
          <p>{errorMessage}</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => void loadExamForAttempt()}
          >
            Retry
          </button>
        </section>
      </main>
    )
  }

  if (!exam || questions.length === 0 || !attemptState) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <AlertTriangle size={42} />
          <h1>Exam Not Available</h1>
          <p>This exam is not approved or questions are not available.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell exam-attempt-page">
      <div
        className="floating-exam-timer"
        style={{
          position: 'fixed',
          top: '88px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          color: '#ffffff',
          boxShadow: '0 18px 45px rgba(79, 70, 229, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.35)',
          minWidth: '190px',
        }}
      >
        <Clock size={22} />
        <div>
          <span
            style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              opacity: 0.9,
            }}
          >
            Time Left
          </span>
          <strong
            style={{
              display: 'block',
              fontSize: '1.45rem',
              lineHeight: 1.1,
              fontWeight: 900,
              letterSpacing: '0.04em',
            }}
          >
            {formatRemainingTime(remainingSeconds)}
          </strong>
        </div>
      </div>

      <section className="exam-attempt-header">
        <div>
          <p className="eyebrow">Student Exam Attempt</p>
          <h1>{exam.title}</h1>
          <p>{exam.description || 'Complete all questions before timer ends.'}</p>
        </div>
      </section>

      <section className="attempt-summary-card">
        <div>
          <span>Total Questions</span>
          <strong>{questions.length}</strong>
        </div>

        <div>
          <span>Answered</span>
          <strong>
            {answeredCount}/{questions.length}
          </strong>
        </div>

        <div>
          <span>Total Marks</span>
          <strong>{totalMarks}</strong>
        </div>

        <div>
          <span>Passing</span>
          <strong>
            <Percent size={16} />
            {exam.passing_marks}%
          </strong>
        </div>
      </section>

      <section className="question-list">
        {questions.map((question, index) => {
          const selectedOption = attemptState.answers[question.id]

          return (
            <article className="question-card" key={question.id}>
              <div className="question-header">
                <h2>
                  Question {index + 1}: {question.question_text}
                </h2>

                <span className="marks-pill">{question.marks} Marks</span>
              </div>

              <div className="option-list">
                {(['A', 'B', 'C', 'D'] as OptionKey[]).map((optionKey) => {
                  const optionText =
                    optionKey === 'A'
                      ? question.option_a
                      : optionKey === 'B'
                        ? question.option_b
                        : optionKey === 'C'
                          ? question.option_c
                          : question.option_d

                  return (
                    <label
                      className={
                        selectedOption === optionKey
                          ? 'option-card option-card-selected'
                          : 'option-card'
                      }
                      key={optionKey}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={optionKey}
                        checked={selectedOption === optionKey}
                        onChange={() => updateAnswer(question.id, optionKey)}
                        disabled={isSubmitting}
                      />

                      <span className="option-key">{optionKey}</span>
                      <span>{optionText}</span>
                    </label>
                  )
                })}
              </div>
            </article>
          )
        })}
      </section>

      <section className="submit-panel">
        <div>
          <CheckCircle2 size={22} />
          <p>
            This submission is saved only for <strong>{profile.name}</strong>.
            Other students can attempt the same exam independently.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          disabled={isSubmitting}
          onClick={() => void submitAttempt(false)}
        >
          {isSubmitting ? (
            <Loader2 size={18} className="spin-icon" />
          ) : (
            <Send size={18} />
          )}
          {isSubmitting ? 'Submitting...' : 'Submit Exam'}
        </button>
      </section>
    </main>
  )
}

export default ExamAttemptPage