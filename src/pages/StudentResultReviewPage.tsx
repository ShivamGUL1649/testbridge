import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Percent,
  Trophy,
  XCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type StudentResultReviewPageProps = {
  profile: UserProfile
}

type OptionKey = 'A' | 'B' | 'C' | 'D'

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
  answers: unknown
  exams?: {
    id: string
    title: string
    description: string | null
    passing_marks: number
  } | null
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

type AnswerDetail = {
  question_id: string
  selected_option: OptionKey | null
  correct_option: OptionKey | null
  is_correct: boolean
  marks: number
  earned_marks: number
}

type ParsedAttemptAnswers = {
  passing_percentage: number
  score_percentage: number
  total_questions: number
  answered_questions: number
  answer_details: AnswerDetail[]
}

function normalizeOption(option: string | null | undefined): OptionKey | null {
  const value = String(option ?? '').trim().toUpperCase()

  if (value === 'A' || value === 'B' || value === 'C' || value === 'D') {
    return value
  }

  return null
}

function getOptionText(question: ExamQuestion, option: OptionKey | null): string {
  if (option === 'A') return question.option_a
  if (option === 'B') return question.option_b
  if (option === 'C') return question.option_c
  if (option === 'D') return question.option_d

  return 'Not answered'
}

function parseAttemptAnswers(rawAnswers: unknown): ParsedAttemptAnswers {
  const fallback: ParsedAttemptAnswers = {
    passing_percentage: 0,
    score_percentage: 0,
    total_questions: 0,
    answered_questions: 0,
    answer_details: [],
  }

  if (!rawAnswers) {
    return fallback
  }

  if (Array.isArray(rawAnswers)) {
    return {
      ...fallback,
      total_questions: rawAnswers.length,
      answered_questions: rawAnswers.filter(
        (answer) => normalizeOption(answer?.selected_option) !== null,
      ).length,
      answer_details: rawAnswers.map((answer) => ({
        question_id: String(answer?.question_id ?? ''),
        selected_option: normalizeOption(answer?.selected_option),
        correct_option: normalizeOption(answer?.correct_option),
        is_correct: Boolean(answer?.is_correct),
        marks: Number(answer?.marks ?? 0),
        earned_marks: Number(answer?.earned_marks ?? 0),
      })),
    }
  }

  if (typeof rawAnswers === 'object') {
    const answersObject = rawAnswers as {
      passing_percentage?: number
      score_percentage?: number
      total_questions?: number
      answered_questions?: number
      answer_details?: unknown
    }

    const answerDetails = Array.isArray(answersObject.answer_details)
      ? answersObject.answer_details.map((answer) => {
          const item = answer as {
            question_id?: string
            selected_option?: string | null
            correct_option?: string | null
            is_correct?: boolean
            marks?: number
            earned_marks?: number
          }

          return {
            question_id: String(item.question_id ?? ''),
            selected_option: normalizeOption(item.selected_option),
            correct_option: normalizeOption(item.correct_option),
            is_correct: Boolean(item.is_correct),
            marks: Number(item.marks ?? 0),
            earned_marks: Number(item.earned_marks ?? 0),
          }
        })
      : []

    return {
      passing_percentage: Number(answersObject.passing_percentage ?? 0),
      score_percentage: Number(answersObject.score_percentage ?? 0),
      total_questions: Number(
        answersObject.total_questions ?? answerDetails.length,
      ),
      answered_questions: Number(
        answersObject.answered_questions ??
          answerDetails.filter((answer) => answer.selected_option !== null)
            .length,
      ),
      answer_details: answerDetails,
    }
  }

  return fallback
}

function StudentResultReviewPage({ profile }: StudentResultReviewPageProps) {
  const { attemptId } = useParams()

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const parsedAnswers = useMemo(() => {
    return parseAttemptAnswers(attempt?.answers)
  }, [attempt])

  const answerMap = useMemo(() => {
    return parsedAnswers.answer_details.reduce<Record<string, AnswerDetail>>(
      (accumulator, answer) => {
        accumulator[answer.question_id] = answer
        return accumulator
      },
      {},
    )
  }, [parsedAnswers.answer_details])

  const calculatedScorePercentage = useMemo(() => {
    if (!attempt || attempt.total_marks <= 0) {
      return 0
    }

    return Number(((attempt.score / attempt.total_marks) * 100).toFixed(2))
  }, [attempt])

  const scorePercentage =
    parsedAnswers.score_percentage > 0
      ? parsedAnswers.score_percentage
      : calculatedScorePercentage

  const passingPercentage =
    parsedAnswers.passing_percentage > 0
      ? parsedAnswers.passing_percentage
      : Number(attempt?.exams?.passing_marks ?? 0)

  async function loadResultReview() {
    if (!attemptId) {
      setErrorMessage('Attempt ID is missing.')
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
      const attemptResponse = await supabase
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
        .eq('id', attemptId)
        .eq('student_id', profile.id)
        .single()

      if (attemptResponse.error) {
        setErrorMessage(attemptResponse.error.message)
        setAttempt(null)
        setQuestions([])
        return
      }

      const loadedAttempt = attemptResponse.data as unknown as ExamAttempt

      const questionsResponse = await supabase
        .from('exam_questions')
        .select(
          'id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, marks, question_order',
        )
        .eq('exam_id', loadedAttempt.exam_id)
        .order('question_order', { ascending: true })

      if (questionsResponse.error) {
        setErrorMessage(questionsResponse.error.message)
        setAttempt(loadedAttempt)
        setQuestions([])
        return
      }

      const loadedQuestions = ((questionsResponse.data ??
        []) as ExamQuestion[]).map((question) => ({
        ...question,
        correct_option:
          normalizeOption(question.correct_option) ?? question.correct_option,
      }))

      setAttempt(loadedAttempt)
      setQuestions(loadedQuestions)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load result review.'

      setErrorMessage(message)
      setAttempt(null)
      setQuestions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadResultReview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, profile.id])

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <Loader2 size={34} className="spin-icon" />
          <h1>Loading Result Review</h1>
          <p>Please wait while we prepare your answer review.</p>
        </section>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main className="page-shell">
        <section className="placeholder-card error-card">
          <AlertTriangle size={42} />
          <h1>Unable to Load Review</h1>
          <p>{errorMessage}</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => void loadResultReview()}
          >
            Retry
          </button>
        </section>
      </main>
    )
  }

  if (!attempt) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <AlertTriangle size={42} />
          <h1>Result Not Found</h1>
          <p>This attempt result was not found for your account.</p>

          <Link to="/student/results" className="primary-button">
            Back to Results
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Student Result Review</p>
          <h1>{attempt.exams?.title ?? 'Exam Review'}</h1>
          <p>
            Review your selected answers, correct answers, marks, and
            explanations.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/student/results" className="secondary-button">
            <ArrowLeft size={18} />
            Back to Results
          </Link>
        </div>
      </section>

      <section className="attempt-summary-card">
        <div>
          <span>Your Score</span>
          <strong>
            <Trophy size={16} />
            {attempt.score}/{attempt.total_marks}
          </strong>
        </div>

        <div>
          <span>Percentage</span>
          <strong>
            <Percent size={16} />
            {scorePercentage}%
          </strong>
        </div>

        <div>
          <span>Passing Percentage</span>
          <strong>
            <Percent size={16} />
            {passingPercentage}%
          </strong>
        </div>

        <div>
          <span>Final Result</span>
          <strong className={attempt.passed ? 'success-text' : 'danger-text'}>
            {attempt.passed ? 'Pass' : 'Fail'}
          </strong>
        </div>
      </section>

      <section className="question-list">
        {questions.map((question, index) => {
          const savedAnswer = answerMap[question.id]

          const selectedOption =
            normalizeOption(savedAnswer?.selected_option) ?? null

          const correctOption =
            normalizeOption(savedAnswer?.correct_option) ??
            normalizeOption(question.correct_option)

          const isCorrect =
            selectedOption !== null &&
            correctOption !== null &&
            selectedOption === correctOption

          return (
            <article className="question-card review-question-card" key={question.id}>
              <div className="question-header">
                <div>
                  <p className="eyebrow">Question {index + 1}</p>
                  <h2>{question.question_text}</h2>
                </div>

                <span
                  className={
                    isCorrect
                      ? 'status-pill status-approved'
                      : 'status-pill status-rejected'
                  }
                >
                  {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  {isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <div className="review-option-list">
                {(['A', 'B', 'C', 'D'] as OptionKey[]).map((optionKey) => {
                  const optionText = getOptionText(question, optionKey)
                  const isSelectedOption = selectedOption === optionKey
                  const isCorrectOption = correctOption === optionKey

                  let optionClassName = 'review-option-row'

                  if (isCorrectOption) {
                    optionClassName += ' review-option-correct'
                  }

                  if (isSelectedOption && !isCorrectOption) {
                    optionClassName += ' review-option-wrong'
                  }

                  if (isSelectedOption) {
                    optionClassName += ' review-option-selected'
                  }

                  return (
                    <div className={optionClassName} key={optionKey}>
                      <div className="review-option-content">
                        <span className="review-option-key">{optionKey})</span>
                        <span className="review-option-text">{optionText}</span>
                      </div>

                      <div className="review-option-badges">
                        {isCorrectOption ? (
                          <span className="review-badge review-badge-correct">
                            Correct Answer
                          </span>
                        ) : null}

                        {isSelectedOption ? (
                          <span className="review-badge review-badge-selected">
                            Your Answer
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="review-answer-row">
                <div className="alert-message alert-warning">
                  Your Answer:{' '}
                  <strong>
                    {selectedOption
                      ? `${selectedOption}) ${getOptionText(
                          question,
                          selectedOption,
                        )}`
                      : 'Not Answered'}
                  </strong>
                </div>

                <div className="alert-message alert-success">
                  Correct Answer:{' '}
                  <strong>
                    {correctOption
                      ? `${correctOption}) ${getOptionText(
                          question,
                          correctOption,
                        )}`
                      : 'Not Available'}
                  </strong>
                </div>
              </div>

              <div className="explanation-card">
                <strong>Explanation:</strong>
                <p>
                  {question.explanation ||
                    'No explanation was added by the tutor.'}
                </p>
              </div>

              <div className="marks-summary">
                <span>Marks</span>
                <strong>
                  {isCorrect ? question.marks : 0}/{question.marks}
                </strong>
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}

export default StudentResultReviewPage