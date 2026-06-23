import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  FolderKanban,
  Loader2,
  RefreshCw,
  Send,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type AdminAiTestReviewPageProps = {
  profile: UserProfile
}

type AiTest = {
  id: string
  title: string
  topic: string
  difficulty: string
  numberOfQuestions: number
  durationMinutes: number
  passingPercentage: number
  status: string
  generatedQuestions: number
  failedReason: string
  prompt: string
  createdAt: string
  updatedAt: string
  completedAt: string

  categoryId?: string
  category_id?: string
  categorySlug?: string
  category_slug?: string
  categoryName?: string
  category_name?: string

  questionType?: string
  question_type?: string
  answerMode?: string
  answer_mode?: string
}

type AiQuestion = {
  id: string
  questionNumber: number
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: 'A' | 'B' | 'C' | 'D' | string
  explanation: string
  marks: number
  createdAt: string
}

type AiTestQuestionsResponse = {
  test: AiTest
  questions: AiQuestion[]
}

type CategoryInfo = {
  id: string
  slug: string
  name: string
}

const gcpBackendBaseUrl = 'https://testbridge-backend-ukm3galdsq-el.a.run.app'
const adminApiKey = 'testbridge-admin-2026'

function formatDate(value: string): string {
  if (!value) return 'N/A'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function getOptionLabel(option: string): string {
  if (option === 'A') return 'A'
  if (option === 'B') return 'B'
  if (option === 'C') return 'C'
  if (option === 'D') return 'D'
  return ''
}

function getOptionText(question: AiQuestion, option: string): string {
  if (option === 'A') return question.optionA
  if (option === 'B') return question.optionB
  if (option === 'C') return question.optionC
  if (option === 'D') return question.optionD
  return ''
}

function isValidCorrectOption(value: string): value is 'A' | 'B' | 'C' | 'D' {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D'
}

function getCategoryInfo(test: AiTest | null): CategoryInfo | null {
  if (!test) {
    return null
  }

  const id = cleanText(test.category_id || test.categoryId)
  const slug = cleanText(test.category_slug || test.categorySlug)
  const name = cleanText(test.category_name || test.categoryName)

  if (!id || !slug) {
    return null
  }

  return {
    id,
    slug,
    name: name || slug,
  }
}

function getQuestionType(test: AiTest | null): string {
  if (!test) return 'SINGLE_CHOICE'

  return cleanText(test.question_type || test.questionType) || 'SINGLE_CHOICE'
}

function getAnswerMode(test: AiTest | null): string {
  if (!test) return 'ONE_CORRECT_ANSWER'

  return cleanText(test.answer_mode || test.answerMode) || 'ONE_CORRECT_ANSWER'
}

async function getApiErrorMessage(response: Response): Promise<string> {
  try {
    const responseText = await response.text()

    if (!responseText) {
      return `Request failed with status ${response.status}.`
    }

    try {
      const parsed = JSON.parse(responseText) as { message?: string }
      return parsed.message || responseText
    } catch {
      return responseText
    }
  } catch {
    return `Request failed with status ${response.status}.`
  }
}

function AdminAiTestReviewPage({ profile }: AdminAiTestReviewPageProps) {
  const navigate = useNavigate()
  const { testId } = useParams<{ testId: string }>()

  const [test, setTest] = useState<AiTest | null>(null)
  const [questions, setQuestions] = useState<AiQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishing, setIsPublishing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [publishedSupabaseExamId, setPublishedSupabaseExamId] = useState('')

  const categoryInfo = useMemo(() => getCategoryInfo(test), [test])
  const questionType = useMemo(() => getQuestionType(test), [test])
  const answerMode = useMemo(() => getAnswerMode(test), [test])

  async function loadTestQuestions() {
    if (!testId) {
      setErrorMessage('Test ID is missing.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(
        `${gcpBackendBaseUrl}/api/ai-tests/${testId}/questions`,
        {
          method: 'GET',
          headers: {
            'x-admin-key': adminApiKey,
          },
        },
      )

      if (!response.ok) {
        const detailedMessage = await getApiErrorMessage(response)
        setErrorMessage(detailedMessage)
        return
      }

      const data = (await response.json()) as AiTestQuestionsResponse

      setTest(data.test || null)
      setQuestions(Array.isArray(data.questions) ? data.questions : [])
    } catch (error) {
      const detailedMessage =
        error instanceof Error
          ? error.message
          : 'Unable to load AI test questions.'

      setErrorMessage(detailedMessage)
    } finally {
      setIsLoading(false)
    }
  }

  function validateBeforePublish(): string | null {
    if (!profile?.id) {
      return 'Admin profile is missing. Please logout and login again.'
    }

    if (profile.role !== 'ADMIN') {
      return 'Only Admin can publish AI generated tests.'
    }

    if (!test) {
      return 'AI test details are missing.'
    }

    if (test.status !== 'DRAFT') {
      return 'Only DRAFT AI tests can be published.'
    }

    if (!categoryInfo) {
      return 'Category is missing in this AI draft. Please generate a new AI test after selecting a category.'
    }

    if (questionType !== 'SINGLE_CHOICE') {
      return 'Only SINGLE_CHOICE AI drafts can be published in the current MVP.'
    }

    if (answerMode !== 'ONE_CORRECT_ANSWER') {
      return 'Only ONE_CORRECT_ANSWER AI drafts can be published in the current MVP.'
    }

    if (questions.length === 0) {
      return 'No questions found for this AI test.'
    }

    if (questions.length !== test.numberOfQuestions) {
      return `Question count mismatch. Expected ${test.numberOfQuestions}, found ${questions.length}.`
    }

    for (const question of questions) {
      if (!question.questionText.trim()) {
        return `Question ${question.questionNumber} is missing question text.`
      }

      if (
        !question.optionA.trim() ||
        !question.optionB.trim() ||
        !question.optionC.trim() ||
        !question.optionD.trim()
      ) {
        return `Question ${question.questionNumber} is missing one or more options.`
      }

      if (!isValidCorrectOption(question.correctOption)) {
        return `Question ${question.questionNumber} has invalid correct option.`
      }
    }

    return null
  }

  async function handlePublishToSupabase() {
    const validationError = validateBeforePublish()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    if (!test || !categoryInfo) return

    const confirmed = window.confirm(
      `Publish this AI generated test to TestBridge?\n\n${test.title}\nCategory: ${categoryInfo.name}\nQuestions: ${questions.length}\n\nThis will create an APPROVED category-aligned test in Supabase and Test Takers can see it.`,
    )

    if (!confirmed) return

    setIsPublishing(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .insert({
          title: test.title.trim(),
          description:
            `AI generated test from Firestore.\n\nCategory: ${categoryInfo.name}\nCategory Slug: ${categoryInfo.slug}\nTopic: ${test.topic}\nDifficulty: ${test.difficulty}\nQuestion Type: ${questionType}\nAnswer Mode: ${answerMode}\nFirestore Test ID: ${test.id}\n\nPrompt:\n${test.prompt || 'N/A'}`,
          category_id: categoryInfo.id,
          category_slug: categoryInfo.slug,
          total_questions: Number(test.numberOfQuestions),
          total_time_minutes: Number(test.durationMinutes),
          passing_marks: Number(test.passingPercentage),
          status: 'APPROVED',
          is_demo: false,
          is_free_demo: false,
          created_by: profile.id,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (examError) {
        setErrorMessage(examError.message)
        return
      }

      if (!examData?.id) {
        setErrorMessage('Supabase test was not created. Please try again.')
        return
      }

      const supabaseExamId = examData.id as string

      const questionPayload = questions.map((question, index) => ({
        exam_id: supabaseExamId,
        question_text: question.questionText.trim(),
        option_a: question.optionA.trim(),
        option_b: question.optionB.trim(),
        option_c: question.optionC.trim(),
        option_d: question.optionD.trim(),
        correct_option: question.correctOption as 'A' | 'B' | 'C' | 'D',
        explanation: question.explanation?.trim() || null,
        marks: Number(question.marks) > 0 ? Number(question.marks) : 1,
        question_order: index + 1,
      }))

      const { error: questionsError } = await supabase
        .from('exam_questions')
        .insert(questionPayload)

      if (questionsError) {
        setErrorMessage(
          `Test created in Supabase, but questions failed: ${questionsError.message}`,
        )
        setPublishedSupabaseExamId(supabaseExamId)
        return
      }

      setPublishedSupabaseExamId(supabaseExamId)
      setSuccessMessage(
        `AI test published successfully to TestBridge under ${categoryInfo.name}. Supabase Test ID: ${supabaseExamId}`,
      )
    } catch (error) {
      const detailedMessage =
        error instanceof Error
          ? error.message
          : 'Unable to publish AI test to Supabase.'

      setErrorMessage(detailedMessage)
    } finally {
      setIsPublishing(false)
    }
  }

  useEffect(() => {
    void loadTestQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId])

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin AI Review</p>
          <h1>Review AI Generated Test</h1>
          <p>
            Review generated questions, options, correct answers and
            explanations from Firestore. Then publish the category-aligned test
            to TestBridge for Test Takers.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/admin/ai-tests')}
          >
            <ArrowLeft size={18} />
            Back to AI Tests
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadTestQuestions()}
            disabled={isLoading || isPublishing}
          >
            {isLoading ? (
              <Loader2 size={18} className="spin-icon" />
            ) : (
              <RefreshCw size={18} />
            )}
            Refresh
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() => void handlePublishToSupabase()}
            disabled={
              isLoading ||
              isPublishing ||
              !test ||
              questions.length === 0 ||
              Boolean(publishedSupabaseExamId)
            }
          >
            {isPublishing ? (
              <Loader2 size={18} className="spin-icon" />
            ) : (
              <Send size={18} />
            )}
            {isPublishing ? 'Publishing...' : 'Publish to TestBridge'}
          </button>
        </div>
      </section>

      {errorMessage ? (
        <div className="alert-message alert-error">
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="alert-message alert-success">
          <CheckCircle2 size={18} />
          <div>
            <strong>{successMessage}</strong>

            {publishedSupabaseExamId ? (
              <p>
                This test is now created in Supabase with APPROVED status and
                should be visible for Test Takers who selected this category.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <section className="placeholder-card">
          <Loader2 size={28} className="spin-icon" />
          <h2>Loading AI test...</h2>
          <p>Please wait while we load questions from Firestore.</p>
        </section>
      ) : null}

      {!isLoading && test ? (
        <>
          <section className="content-card">
            <div className="section-title-row">
              <div>
                <h2>{test.title}</h2>
                <p>{test.topic}</p>
              </div>

              <span className="status-badge approved">
                <CheckCircle2 size={14} />
                {test.status}
              </span>
            </div>

            {!categoryInfo ? (
              <div className="alert-message alert-error create-exam-note">
                <AlertCircle size={18} />
                <div>
                  <strong>Category missing in this AI draft.</strong>
                  <p>
                    This draft was likely generated before category support was
                    added. Please generate a new AI test after selecting a
                    category.
                  </p>
                </div>
              </div>
            ) : (
              <div className="alert-message alert-success create-exam-note">
                <FolderKanban size={18} />
                <div>
                  <strong>Category: {categoryInfo.name}</strong>
                  <p>/practice/{categoryInfo.slug}</p>
                </div>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <FileText size={22} />
                <span>Total Questions</span>
                <strong>{test.numberOfQuestions}</strong>
              </div>

              <div className="stat-card">
                <Database size={22} />
                <span>Generated</span>
                <strong>{test.generatedQuestions}</strong>
              </div>

              <div className="stat-card">
                <Clock size={22} />
                <span>Duration</span>
                <strong>{test.durationMinutes} min</strong>
              </div>

              <div className="stat-card">
                <CheckCircle2 size={22} />
                <span>Passing</span>
                <strong>{test.passingPercentage}%</strong>
              </div>
            </div>

            <div className="create-exam-note">
              <strong>Firestore Test ID:</strong> {test.id}
            </div>

            {publishedSupabaseExamId ? (
              <div className="create-exam-note">
                <strong>Published Supabase Test ID:</strong>{' '}
                {publishedSupabaseExamId}
              </div>
            ) : null}

            <div className="create-exam-note">
              <strong>Difficulty:</strong> {test.difficulty} |{' '}
              <strong>Question Type:</strong> {questionType} |{' '}
              <strong>Answer Mode:</strong> {answerMode} |{' '}
              <strong>Created:</strong> {formatDate(test.createdAt)}
            </div>
          </section>

          <section className="content-card">
            <div className="section-title-row">
              <div>
                <h2>Generated Questions</h2>
                <p>
                  Review every question carefully before publishing this test to
                  Test Takers.
                </p>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="placeholder-card">
                <FileText size={28} />
                <h2>No questions found</h2>
                <p>This Firestore test does not have question documents.</p>
              </div>
            ) : (
              <div className="question-review-list">
                {questions.map((question) => {
                  const correctLabel = getOptionLabel(question.correctOption)
                  const correctText = getOptionText(
                    question,
                    question.correctOption,
                  )

                  return (
                    <article
                      key={question.id}
                      className="question-review-card"
                    >
                      <div className="question-review-header">
                        <div>
                          <p className="eyebrow">
                            Question {question.questionNumber}
                          </p>
                          <h3>{question.questionText}</h3>
                        </div>

                        <span className="status-badge approved">
                          {question.marks} Mark
                        </span>
                      </div>

                      <div className="options-review-list">
                        <div
                          className={
                            question.correctOption === 'A'
                              ? 'option-review-item correct-option'
                              : 'option-review-item'
                          }
                        >
                          <strong>A)</strong>
                          <span>{question.optionA}</span>
                        </div>

                        <div
                          className={
                            question.correctOption === 'B'
                              ? 'option-review-item correct-option'
                              : 'option-review-item'
                          }
                        >
                          <strong>B)</strong>
                          <span>{question.optionB}</span>
                        </div>

                        <div
                          className={
                            question.correctOption === 'C'
                              ? 'option-review-item correct-option'
                              : 'option-review-item'
                          }
                        >
                          <strong>C)</strong>
                          <span>{question.optionC}</span>
                        </div>

                        <div
                          className={
                            question.correctOption === 'D'
                              ? 'option-review-item correct-option'
                              : 'option-review-item'
                          }
                        >
                          <strong>D)</strong>
                          <span>{question.optionD}</span>
                        </div>
                      </div>

                      <div className="alert-message alert-success create-exam-note">
                        <CheckCircle2 size={18} />
                        <div>
                          <strong>
                            Correct Answer: {correctLabel}) {correctText}
                          </strong>
                          <p>{question.explanation}</p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  )
}

export default AdminAiTestReviewPage
