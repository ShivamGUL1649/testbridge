import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BellRing,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  LockKeyhole,
  Mail,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import SupportContact from '../components/SupportContact'

import './PublicDemo.css'

type DemoExam = {
  id: string
  title: string
  description: string | null
  total_questions: number | null
  total_time_minutes: number | null
  passing_marks: number | null
  status: string
  category_id: string | null
  category_slug: string | null
  is_demo: boolean
  demo_slug: string | null
}

type DemoCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  demo_enabled: boolean
  show_demo_explanations: boolean
  show_register_cta: boolean
}

type DemoQuestion = {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: string
  explanation: string | null
  marks: number | null
  question_order: number | null
}

type SelectedAnswers = Record<string, string>

type InterestStatus = {
  type: 'success' | 'error'
  message: string
}

const optionLabels = ['A', 'B', 'C', 'D'] as const

function normalizeCorrectOption(value: string | null | undefined) {
  return (value || '').trim().toUpperCase()
}

function getQuestionOption(question: DemoQuestion, option: string) {
  if (option === 'A') return question.option_a
  if (option === 'B') return question.option_b
  if (option === 'C') return question.option_c
  return question.option_d
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function PublicDemoAttemptPage() {
  const { demoSlug } = useParams()

  const [exam, setExam] = useState<DemoExam | null>(null)
  const [category, setCategory] = useState<DemoCategory | null>(null)
  const [questions, setQuestions] = useState<DemoQuestion[]>([])
  const [answers, setAnswers] = useState<SelectedAnswers>({})
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadMessage, setLeadMessage] = useState('')
  const [interestStatus, setInterestStatus] = useState<InterestStatus | null>(null)
  const [isSubmittingInterest, setIsSubmittingInterest] = useState(false)

  const totalQuestions = questions.length

  const answeredCount = useMemo(() => {
    return Object.keys(answers).length
  }, [answers])

  const scoreDetails = useMemo(() => {
    let correctCount = 0
    let totalMarks = 0
    let earnedMarks = 0

    questions.forEach((question) => {
      const marks = question.marks || 1
      const selectedAnswer = answers[question.id]
      const correctAnswer = normalizeCorrectOption(question.correct_option)

      totalMarks += marks

      if (selectedAnswer === correctAnswer) {
        correctCount += 1
        earnedMarks += marks
      }
    })

    const percentage = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0
    const passingPercentage = exam?.passing_marks || 70

    return {
      correctCount,
      totalMarks,
      earnedMarks,
      percentage,
      passingPercentage,
      isPassed: percentage >= passingPercentage,
    }
  }, [answers, exam?.passing_marks, questions])

  async function loadDemoTest() {
    if (!demoSlug) {
      setErrorMessage('Demo test link is invalid.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setIsSubmitted(false)
    setAnswers({})
    setInterestStatus(null)

    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .select(
          [
            'id',
            'title',
            'description',
            'total_questions',
            'total_time_minutes',
            'passing_marks',
            'status',
            'category_id',
            'category_slug',
            'is_demo',
            'demo_slug',
          ].join(', '),
        )
        .eq('demo_slug', demoSlug)
        .eq('status', 'APPROVED')
        .eq('is_demo', true)
        .maybeSingle()

      if (examError) {
        throw new Error(examError.message)
      }

      if (!examData) {
        setErrorMessage('This demo test is not available yet.')
        return
      }

      const loadedExam = examData as unknown as DemoExam
      setExam(loadedExam)

      let loadedCategory: DemoCategory | null = null

      if (loadedExam.category_id) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('exam_categories')
          .select(
            'id, name, slug, description, demo_enabled, show_demo_explanations, show_register_cta',
          )
          .eq('id', loadedExam.category_id)
          .eq('is_active', true)
          .maybeSingle()

        if (categoryError) {
          throw new Error(categoryError.message)
        }

        loadedCategory = categoryData as unknown as DemoCategory | null
      }

      setCategory(loadedCategory)

      if (loadedCategory && !loadedCategory.demo_enabled) {
        setErrorMessage('Demo is currently disabled for this topic.')
        return
      }

      const questionLimit =
        loadedExam.total_questions && loadedExam.total_questions > 0
          ? loadedExam.total_questions
          : 50

      const durationMinutes = loadedExam.total_time_minutes || 15

      const { data: questionData, error: questionError } = await supabase
        .from('exam_questions')
        .select(
          'id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, marks, question_order',
        )
        .eq('exam_id', loadedExam.id)
        .order('question_order', { ascending: true })
        .limit(questionLimit)

      if (questionError) {
        throw new Error(questionError.message)
      }

      const loadedQuestions = (questionData as unknown as DemoQuestion[]) || []

      if (loadedQuestions.length === 0) {
        setErrorMessage('No questions are available for this demo test yet.')
        return
      }

      setQuestions(loadedQuestions)
      setSecondsLeft(durationMinutes * 60)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load demo test.'

      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDemoTest()
  }, [demoSlug])

  useEffect(() => {
    if (isSubmitted || secondsLeft <= 0 || questions.length === 0) {
      return
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setIsSubmitted(true)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => {
      window.clearInterval(timer)
    }
  }, [isSubmitted, questions.length, secondsLeft])

  function handleAnswerChange(questionId: string, selectedOption: string) {
    if (isSubmitted) {
      return
    }

    setAnswers((current) => ({
      ...current,
      [questionId]: selectedOption,
    }))
  }

  function handleSubmit() {
    setIsSubmitted(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function resolveCurrentProfileId() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        return null
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()

      if (error) {
        return null
      }

      return (data as { id?: string } | null)?.id || null
    } catch {
      return null
    }
  }

  async function handlePaidInterestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setInterestStatus(null)

    const cleanEmail = leadEmail.trim().toLowerCase()
    const cleanName = leadName.trim()
    const cleanMessage = leadMessage.trim()

    if (!isValidEmail(cleanEmail)) {
      setInterestStatus({
        type: 'error',
        message:
          'Please enter a valid email address so we can contact you when the paid pack is ready.',
      })
      return
    }

    setIsSubmittingInterest(true)

    try {
      const profileId = await resolveCurrentProfileId()
      const fallbackMessage = `Interested after scoring ${scoreDetails.percentage}% in ${exam?.title || 'public demo test'}.`

      const { error } = await supabase.from('paid_interest_leads').insert({
        user_id: profileId,
        name: cleanName || null,
        email: cleanEmail,
        category_id: category?.id || null,
        category_slug: category?.slug || exam?.category_slug || null,
        category_name: category?.name || 'TestBridge practice pack',
        message: cleanMessage || fallbackMessage,
        source: 'public_demo_result',
      })

      if (error) {
        throw new Error(error.message)
      }

      setInterestStatus({
        type: 'success',
        message:
          'Thanks. Your interest has been saved. We will use this to prioritize paid practice packs.',
      })
      setLeadMessage('')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to save your interest right now.'

      setInterestStatus({ type: 'error', message })
    } finally {
      setIsSubmittingInterest(false)
    }
  }

  if (isLoading) {
    return (
      <main className="demo-attempt-page">
        <section className="demo-empty-state">
          <Sparkles size={28} />
          <h1>Loading your demo test...</h1>
          <p>Please wait while TestBridge prepares your questions.</p>
        </section>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main className="demo-attempt-page">
        <section className="demo-empty-state demo-error-state">
          <AlertCircle size={28} />
          <h1>Unable to open this demo test</h1>
          <p>{errorMessage}</p>

          <div className="demo-hero-actions">
            <Link to="/demo" className="demo-btn-primary">
              <ArrowLeft size={18} />
              Back to Demo Page
            </Link>

            <button
              type="button"
              className="demo-btn-secondary"
              onClick={() => void loadDemoTest()}
            >
              <RefreshCw size={18} />
              Retry
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="demo-attempt-page">
      <section className="demo-attempt-header">
        <div>
          <p className="eyebrow">Free Demo Test</p>

          <h1>{exam?.title || 'TestBridge Demo Test'}</h1>

          <p>
            {category?.name
              ? `${category.name} practice demo with instant score and answer review.`
              : 'Practice demo with instant score and answer review.'}
          </p>
        </div>

        <aside
          className={
            secondsLeft <= 60
              ? 'demo-timer-card demo-timer-danger'
              : 'demo-timer-card'
          }
        >
          <div className="demo-timer-icon">
            <Clock size={20} />
          </div>

          <div>
            <span className="demo-timer-value">{formatTime(secondsLeft)}</span>
            <span className="demo-timer-label">Time Left</span>
          </div>
        </aside>
      </section>

      <section className="demo-progress-grid" aria-label="Demo progress summary">
        <div className="demo-progress-stat">
          <strong>{answeredCount}</strong>
          <span>Answered</span>
        </div>

        <div className="demo-progress-stat">
          <strong>{totalQuestions}</strong>
          <span>Total Questions</span>
        </div>

        <div className="demo-progress-stat">
          <strong>{scoreDetails.passingPercentage}%</strong>
          <span>Passing Target</span>
        </div>

        <div className="demo-progress-stat">
          <strong>No Login</strong>
          <span>Free Demo</span>
        </div>
      </section>

      {isSubmitted ? (
        <section className="demo-result-hero">
          <div>
            <p className="eyebrow">Demo Result</p>

            <h2>You scored {scoreDetails.percentage}% in this free demo test.</h2>

            <p>
              Correct answers: {scoreDetails.correctCount} out of {totalQuestions}.
              Review explanations below and register to unlock more practice
              tests for this topic.
            </p>

            {category?.show_register_cta !== false ? (
              <div className="demo-hero-actions">
                <Link to="/register" className="demo-btn-primary">
                  <LockKeyhole size={18} />
                  Register for More Tests
                </Link>

                <Link to="/test-packs" className="demo-btn-secondary">
                  View Test Packs
                </Link>
              </div>
            ) : null}
          </div>

          <div className="demo-score-circle">
            <span>{scoreDetails.percentage}%</span>
            <small>{scoreDetails.isPassed ? 'Passed' : 'Keep Practicing'}</small>
          </div>
        </section>
      ) : null}

      {isSubmitted ? (
        <section className="demo-interest-card">
          <div className="demo-interest-copy">
            <p className="eyebrow">Paid Pack Interest</p>
            <h2>Want the full {category?.name || 'practice'} pack?</h2>
            <p>
              Share your email if you want early access or launch updates for the
              paid practice pack. This helps Admin understand real user demand
              before adding payment gateway support.
            </p>
          </div>

          <form className="demo-interest-form" onSubmit={handlePaidInterestSubmit}>
            <label className="demo-mini-field">
              <span>
                <UserRound size={16} />
                Name
              </span>
              <input
                type="text"
                value={leadName}
                maxLength={120}
                placeholder="Your name"
                onChange={(event) => setLeadName(event.target.value)}
              />
            </label>

            <label className="demo-mini-field">
              <span>
                <Mail size={16} />
                Email
              </span>
              <input
                type="email"
                value={leadEmail}
                maxLength={180}
                placeholder="you@example.com"
                required
                onChange={(event) => setLeadEmail(event.target.value)}
              />
            </label>

            <label className="demo-mini-field demo-mini-field-full">
              <span>
                <BellRing size={16} />
                Optional message
              </span>
              <textarea
                value={leadMessage}
                maxLength={500}
                rows={3}
                placeholder="Example: I am interested in Google Gen AI Leader paid practice tests."
                onChange={(event) => setLeadMessage(event.target.value)}
              />
            </label>

            {interestStatus ? (
              <div
                className={
                  interestStatus.type === 'success'
                    ? 'demo-alert demo-alert-success'
                    : 'demo-alert demo-alert-error'
                }
              >
                {interestStatus.type === 'success' ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                {interestStatus.message}
              </div>
            ) : null}

            <button
              type="submit"
              className="demo-btn-primary"
              disabled={isSubmittingInterest}
            >
              <Send size={18} />
              {isSubmittingInterest ? 'Saving Interest...' : 'I Am Interested'}
            </button>
          </form>
        </section>
      ) : null}

      <section className="demo-question-list">
        {questions.map((question, index) => {
          const selectedAnswer = answers[question.id]
          const correctAnswer = normalizeCorrectOption(question.correct_option)
          const isCorrect = selectedAnswer === correctAnswer

          return (
            <article className="demo-question-card" key={question.id}>
              <div className="demo-question-topline">
                <span>Question {index + 1}</span>

                {isSubmitted ? (
                  isCorrect ? (
                    <strong className="demo-question-status demo-question-status-correct">
                      <CheckCircle2 size={16} />
                      Correct
                    </strong>
                  ) : (
                    <strong className="demo-question-status demo-question-status-wrong">
                      <XCircle size={16} />
                      Incorrect
                    </strong>
                  )
                ) : null}
              </div>

              <h2>{question.question_text}</h2>

              <div className="demo-options-list">
                {optionLabels.map((option) => {
                  const optionText = getQuestionOption(question, option)
                  const isSelected = selectedAnswer === option
                  const isRightOption = correctAnswer === option

                  let optionClass = 'demo-option-card'

                  if (isSubmitted && isRightOption) {
                    optionClass += ' demo-option-correct'
                  } else if (isSubmitted && isSelected && !isRightOption) {
                    optionClass += ' demo-option-wrong'
                  } else if (isSelected) {
                    optionClass += ' demo-option-selected'
                  }

                  return (
                    <label className={optionClass} key={option}>
                      <input
                        className="demo-option-radio"
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={isSelected}
                        disabled={isSubmitted}
                        onChange={() => handleAnswerChange(question.id, option)}
                      />

                      <span className="demo-option-letter">{option}</span>

                      <span className="demo-option-text">{optionText}</span>
                    </label>
                  )
                })}
              </div>

              {isSubmitted && category?.show_demo_explanations !== false ? (
                <div className="demo-explanation-card">
                  <BookOpenCheck size={18} />

                  <div>
                    <strong>Explanation</strong>
                    <p>
                      {question.explanation ||
                        'Explanation is not available for this question yet.'}
                    </p>
                  </div>
                </div>
              ) : null}
            </article>
          )
        })}
      </section>

      {!isSubmitted ? (
        <section className="demo-submit-card">
          <div>
            <p className="eyebrow">Ready to submit?</p>

            <h2>Submit your demo test and check your score instantly.</h2>

            <p>
              You have answered {answeredCount} of {totalQuestions} questions.
              You can submit even if some questions are unanswered.
            </p>
          </div>

          <button
            type="button"
            className="demo-btn-primary"
            onClick={handleSubmit}
          >
            <Send size={18} />
            Submit Demo Test
          </button>
        </section>
      ) : (
        <section className="demo-submit-card">
          <div>
            <p className="eyebrow">Next Step</p>

            <h2>Want more practice questions like this?</h2>

            <p>
              Register to access more practice tests, full attempts, result
              history, and answer review for your selected topic.
            </p>
          </div>

          <div className="demo-hero-actions">
            <Link to="/register" className="demo-btn-primary">
              <Award size={18} />
              Register Now
            </Link>

            <Link to="/demo" className="demo-btn-secondary">
              <Sparkles size={18} />
              Try Another Demo
            </Link>
          </div>
        </section>
      )}

      <SupportContact
        variant="banner"
        title="Need help with this demo?"
        description="Contact TestBridge support if you have trouble with demo access, registration, or practice pack information."
      />

      <section className="demo-note-card demo-disclaimer-card">
        <AlertCircle size={18} />
        <span>
          This is a free demo test for practice only. Questions are original and
          designed for learning; they are not official exam questions.
        </span>
      </section>
    </main>
  )
}

export default PublicDemoAttemptPage
