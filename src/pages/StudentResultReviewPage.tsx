import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Trophy,
  XCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type StudentResultReviewPageProps = {
  profile: UserProfile
}

type OptionKey = 'A' | 'B' | 'C' | 'D'

type AnswerDetail = {
  question_id: string
  selected_option: OptionKey | null
  correct_option: OptionKey | null
  is_correct: boolean
  marks: number
  earned_marks: number
}

type StoredAnswersObject = {
  passing_percentage?: number
  score_percentage?: number
  total_questions?: number
  answered_questions?: number
  answer_details?: AnswerDetail[]
}

type ReviewAttempt = {
  id: string
  exam_id: string
  student_id: string
  score: number
  total_marks: number
  passed: boolean
  submitted_at: string | null
  answers: StoredAnswersObject | AnswerDetail[] | null
  exams?: {
    id: string
    title: string
    description: string | null
    passing_marks: number
  } | null
}

type ReviewQuestion = {
  id: string
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

function normalizeOption(option: unknown): OptionKey | null {
  const value = String(option ?? '').trim().toUpperCase()

  if (value === 'A' || value === 'B' || value === 'C' || value === 'D') {
    return value
  }

  return null
}

function getOptionText(question: ReviewQuestion, optionKey: OptionKey): string {
  if (optionKey === 'A') return question.option_a
  if (optionKey === 'B') return question.option_b
  if (optionKey === 'C') return question.option_c
  return question.option_d
}

function getAnswerDetails(answers: ReviewAttempt['answers']): AnswerDetail[] {
  if (!answers) return []

  if (Array.isArray(answers)) {
    return answers.map((answer) => ({
      ...answer,
      selected_option: normalizeOption(answer.selected_option),
      correct_option: normalizeOption(answer.correct_option),
    }))
  }

  if (Array.isArray(answers.answer_details)) {
    return answers.answer_details.map((answer) => ({
      ...answer,
      selected_option: normalizeOption(answer.selected_option),
      correct_option: normalizeOption(answer.correct_option),
    }))
  }

  return []
}

function getPercentage(score: number, totalMarks: number): number {
  if (totalMarks <= 0) return 0
  return Number(((score / totalMarks) * 100).toFixed(2))
}

function StudentResultReviewPage({ profile }: StudentResultReviewPageProps) {
  const { attemptId } = useParams()

  const [attempt, setAttempt] = useState<ReviewAttempt | null>(null)
  const [questions, setQuestions] = useState<ReviewQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function loadReview() {
    if (!attemptId) {
      setErrorMessage('Attempt ID is missing.')
      setIsLoading(false)
      return
    }

    if (!profile?.id) {
      setErrorMessage('Test Taker profile is missing. Please logout and login again.')
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
          score,
          total_marks,
          passed,
          submitted_at,
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

      const loadedAttempt = attemptResponse.data as unknown as ReviewAttempt

      const questionsResponse = await supabase
        .from('exam_questions')
        .select(
          'id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, marks, question_order',
        )
        .eq('exam_id', loadedAttempt.exam_id)
        .order('question_order', { ascending: true })

      if (questionsResponse.error) {
        setErrorMessage(questionsResponse.error.message)
        setAttempt(loadedAttempt)
        setQuestions([])
        return
      }

      setAttempt(loadedAttempt)
      setQuestions((questionsResponse.data ?? []) as ReviewQuestion[])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load test review.'

      setErrorMessage(message)
      setAttempt(null)
      setQuestions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadReview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, profile.id])

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <Loader2 size={34} className="spin-icon" />
          <h1>Loading Review</h1>
          <p>Please wait while we load your test review.</p>
        </section>
      </main>
    )
  }

  if (errorMessage || !attempt) {
    return (
      <main className="page-shell">
        <section className="placeholder-card error-card">
          <XCircle size={42} />
          <h1>Unable to Load Review</h1>
          <p>{errorMessage || 'Review details are not available.'}</p>

          <Link to="/student/results" className="primary-button">
            Back to My Results
          </Link>
        </section>
      </main>
    )
  }

  const answerDetails = getAnswerDetails(attempt.answers)
  const answerMap = new Map(
    answerDetails.map((answer) => [answer.question_id, answer]),
  )
  const percentage = getPercentage(attempt.score, attempt.total_marks)

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Test Review</p>
          <h1>{attempt.exams?.title ?? 'Test Result Review'}</h1>
          <p>
            Review your selected answers, correct answers, marks, and
            explanations.
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to="/student/results" className="secondary-button">
            <ArrowLeft size={18} />
            Back to My Results
          </Link>
        </div>
      </section>

      <section className="attempt-summary-card">
        <div>
          <span>Status</span>
          <strong>
            {attempt.passed ? (
              <>
                <CheckCircle2 size={18} />
                Pass
              </>
            ) : (
              <>
                <XCircle size={18} />
                Fail
              </>
            )}
          </strong>
        </div>

        <div>
          <span>Score</span>
          <strong>
            <Trophy size={18} />
            {attempt.score}/{attempt.total_marks}
          </strong>
        </div>

        <div>
          <span>Percentage</span>
          <strong>{percentage}%</strong>
        </div>

        <div>
          <span>Passing Percentage</span>
          <strong>{attempt.exams?.passing_marks ?? 0}%</strong>
        </div>
      </section>

      <section className="question-list">
        {questions.map((question, index) => {
          const answer = answerMap.get(question.id)
          const selectedOption = normalizeOption(answer?.selected_option)
          const correctOption =
            normalizeOption(answer?.correct_option) ??
            normalizeOption(question.correct_option)

          return (
            <article className="question-card review-question-card" key={question.id}>
              <div className="question-header">
                <div>
                  <p className="eyebrow">Question {index + 1}</p>
                  <h2>{question.question_text}</h2>
                </div>

                <span
                  className={
                    answer?.is_correct
                      ? 'status-pill status-approved'
                      : 'status-pill status-rejected'
                  }
                >
                  {answer?.is_correct ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  {answer?.is_correct ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <div className="review-option-list">
                {(['A', 'B', 'C', 'D'] as OptionKey[]).map((optionKey) => {
                  const isCorrectAnswer = correctOption === optionKey
                  const isSelectedAnswer = selectedOption === optionKey
                  const isWrongSelected =
                    isSelectedAnswer && selectedOption !== correctOption

                  let optionClass = 'review-option-row'

                  if (isCorrectAnswer) {
                    optionClass += ' review-option-correct'
                  }

                  if (isSelectedAnswer) {
                    optionClass += ' review-option-selected'
                  }

                  if (isWrongSelected) {
                    optionClass += ' review-option-wrong'
                  }

                  return (
                    <div className={optionClass} key={optionKey}>
                      <div className="review-option-content">
                        <span className="review-option-key">{optionKey}</span>
                        <span className="review-option-text">
                          {getOptionText(question, optionKey)}
                        </span>
                      </div>

                      <div className="review-option-badges">
                        {isCorrectAnswer ? (
                          <span className="review-badge review-badge-correct">
                            Correct Answer
                          </span>
                        ) : null}

                        {isSelectedAnswer ? (
                          <span className="review-badge review-badge-selected">
                            Your Answer
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="exam-meta-grid">
                <div>
                  <span>Marks</span>
                  <strong>
                    {answer?.earned_marks ?? 0}/{question.marks}
                  </strong>
                </div>

                <div>
                  <span>Your Answer</span>
                  <strong>
                    {selectedOption
                      ? `${selectedOption}) ${getOptionText(
                          question,
                          selectedOption,
                        )}`
                      : 'Not Answered'}
                  </strong>
                </div>

                <div>
                  <span>Correct Answer</span>
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
                    'No explanation was added for this question.'}
                </p>
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}

export default StudentResultReviewPage