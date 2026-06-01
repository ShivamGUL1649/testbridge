import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Loader2,
  PlusCircle,
  Save,
  Trash2,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type ExamStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

type OptionKey = 'A' | 'B' | 'C' | 'D'

type ExamDetails = {
  id: string
  title: string
  description: string | null
  status: ExamStatus
  created_by: string
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
  created_at: string
}

type QuestionFormState = {
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: OptionKey
  explanation: string
  marks: string
}

type AddQuestionsPageProps = {
  profile: UserProfile
}

const initialQuestionForm: QuestionFormState = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctOption: 'A',
  explanation: '',
  marks: '1',
}

function AddQuestionsPage({ profile }: AddQuestionsPageProps) {
  const { examId } = useParams<{ examId: string }>()

  const [exam, setExam] = useState<ExamDetails | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [formState, setFormState] =
    useState<QuestionFormState>(initialQuestionForm)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(
    null,
  )

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const canModifyExam = useMemo(() => {
    return exam?.status === 'DRAFT' || exam?.status === 'REJECTED'
  }, [exam?.status])

  async function loadExamAndQuestions() {
    if (!examId) {
      setErrorMessage('Exam id is missing from the route.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const { data: examData, error: examError } = await supabase
      .from('exams')
      .select('id, title, description, status, created_by')
      .eq('id', examId)
      .eq('created_by', profile.id)
      .single()

    if (examError) {
      setExam(null)
      setQuestions([])
      setErrorMessage(examError.message)
      setIsLoading(false)
      return
    }

    const { data: questionData, error: questionError } = await supabase
      .from('exam_questions')
      .select(
        'id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, marks, question_order, created_at',
      )
      .eq('exam_id', examId)
      .order('question_order', { ascending: true })

    if (questionError) {
      setExam(examData as ExamDetails)
      setQuestions([])
      setErrorMessage(questionError.message)
      setIsLoading(false)
      return
    }

    setExam(examData as ExamDetails)
    setQuestions((questionData ?? []) as ExamQuestion[])
    setIsLoading(false)
  }

  useEffect(() => {
    void loadExamAndQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, profile.id])

  function updateFormField(
    fieldName: keyof QuestionFormState,
    value: string,
  ) {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [fieldName]: value,
    }))
  }

  function validateQuestionForm(): string | null {
    if (!formState.questionText.trim()) {
      return 'Question text is required.'
    }

    if (!formState.optionA.trim()) {
      return 'Option A is required.'
    }

    if (!formState.optionB.trim()) {
      return 'Option B is required.'
    }

    if (!formState.optionC.trim()) {
      return 'Option C is required.'
    }

    if (!formState.optionD.trim()) {
      return 'Option D is required.'
    }

    const marks = Number(formState.marks)

    if (!Number.isFinite(marks) || marks <= 0) {
      return 'Marks must be greater than 0.'
    }

    return null
  }

  async function handleAddQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!examId) {
      setErrorMessage('Exam id is missing from the route.')
      return
    }

    if (!canModifyExam) {
      setErrorMessage(
        'Questions can be changed only when exam status is Draft or Rejected.',
      )
      return
    }

    const validationError = validateQuestionForm()

    if (validationError) {
      setErrorMessage(validationError)
      setSuccessMessage('')
      return
    }

    const nextQuestionOrder = questions.length + 1

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const { data, error } = await supabase
      .from('exam_questions')
      .insert({
        exam_id: examId,
        question_text: formState.questionText.trim(),
        option_a: formState.optionA.trim(),
        option_b: formState.optionB.trim(),
        option_c: formState.optionC.trim(),
        option_d: formState.optionD.trim(),
        correct_option: formState.correctOption,
        explanation: formState.explanation.trim() || null,
        marks: Number(formState.marks),
        question_order: nextQuestionOrder,
      })
      .select(
        'id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, marks, question_order, created_at',
      )
      .single()

    if (error) {
      setErrorMessage(error.message)
      setIsSaving(false)
      return
    }

    setQuestions((currentQuestions) => [
      ...currentQuestions,
      data as ExamQuestion,
    ])
    setFormState(initialQuestionForm)
    setSuccessMessage('Question added successfully.')
    setIsSaving(false)
  }

  async function handleDeleteQuestion(questionId: string) {
    if (!canModifyExam) {
      setErrorMessage(
        'Questions can be deleted only when exam status is Draft or Rejected.',
      )
      return
    }

    setDeletingQuestionId(questionId)
    setErrorMessage('')
    setSuccessMessage('')

    const { error } = await supabase
      .from('exam_questions')
      .delete()
      .eq('id', questionId)
      .eq('exam_id', examId)

    if (error) {
      setErrorMessage(error.message)
      setDeletingQuestionId(null)
      return
    }

    setQuestions((currentQuestions) =>
      currentQuestions.filter((question) => question.id !== questionId),
    )
    setSuccessMessage('Question deleted successfully.')
    setDeletingQuestionId(null)
  }

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="content-card">
          <div className="inline-loading">
            <Loader2 size={22} className="spin-icon" />
            Loading exam questions...
          </div>
        </section>
      </main>
    )
  }

  if (!exam) {
    return (
      <main className="page-shell">
        <section className="placeholder-card error-card">
          <p className="eyebrow">Exam Not Found</p>
          <h1>Unable to load exam</h1>
          <p>{errorMessage || 'The exam does not exist or is not yours.'}</p>

          <Link to="/tutor/exams" className="secondary-button">
            <ArrowLeft size={17} />
            Back to Exams
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Question Bank</p>
          <h1>{exam.title}</h1>
          <p>
            Add multiple-choice questions, correct answers, marks, and
            explanations. Explanations will be shown only after result.
          </p>
        </div>

        <Link to="/tutor/exams" className="secondary-button">
          <ArrowLeft size={17} />
          Back to Exams
        </Link>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <span>Total Questions</span>
          <strong>{questions.length}</strong>
        </article>

        <article className="stat-card">
          <span>Total Marks</span>
          <strong>
            {questions.reduce(
              (totalMarks, question) => totalMarks + question.marks,
              0,
            )}
          </strong>
        </article>

        <article className="stat-card">
          <span>Exam Status</span>
          <strong>{exam.status.replace('_', ' ')}</strong>
        </article>
      </section>

      {!canModifyExam ? (
        <div className="alert-message alert-error">
          This exam is already published or approved. For MVP, questions are
          editable only in Draft or Rejected status.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="alert-message alert-success">
          <CheckCircle2 size={18} />
          {successMessage}
        </div>
      ) : null}

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>Add Question</h2>
              <p>
                Correct answer is stored for result calculation, but it should
                not be exposed on the student exam screen.
              </p>
            </div>
          </div>

          <form className="form-card" onSubmit={handleAddQuestion}>
            <label className="form-field">
              <span>Question Text</span>
              <textarea
                value={formState.questionText}
                onChange={(event) =>
                  updateFormField('questionText', event.target.value)
                }
                placeholder="Enter question text"
                rows={4}
                disabled={!canModifyExam || isSaving}
              />
            </label>

            <div className="form-grid">
              <label className="form-field">
                <span>Option A</span>
                <input
                  type="text"
                  value={formState.optionA}
                  onChange={(event) =>
                    updateFormField('optionA', event.target.value)
                  }
                  placeholder="Enter option A"
                  disabled={!canModifyExam || isSaving}
                />
              </label>

              <label className="form-field">
                <span>Option B</span>
                <input
                  type="text"
                  value={formState.optionB}
                  onChange={(event) =>
                    updateFormField('optionB', event.target.value)
                  }
                  placeholder="Enter option B"
                  disabled={!canModifyExam || isSaving}
                />
              </label>

              <label className="form-field">
                <span>Option C</span>
                <input
                  type="text"
                  value={formState.optionC}
                  onChange={(event) =>
                    updateFormField('optionC', event.target.value)
                  }
                  placeholder="Enter option C"
                  disabled={!canModifyExam || isSaving}
                />
              </label>

              <label className="form-field">
                <span>Option D</span>
                <input
                  type="text"
                  value={formState.optionD}
                  onChange={(event) =>
                    updateFormField('optionD', event.target.value)
                  }
                  placeholder="Enter option D"
                  disabled={!canModifyExam || isSaving}
                />
              </label>
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>Correct Option</span>
                <select
                  value={formState.correctOption}
                  onChange={(event) =>
                    updateFormField(
                      'correctOption',
                      event.target.value as OptionKey,
                    )
                  }
                  disabled={!canModifyExam || isSaving}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </label>

              <label className="form-field">
                <span>Marks</span>
                <input
                  type="number"
                  min="1"
                  value={formState.marks}
                  onChange={(event) =>
                    updateFormField('marks', event.target.value)
                  }
                  disabled={!canModifyExam || isSaving}
                />
              </label>
            </div>

            <label className="form-field">
              <span>Explanation</span>
              <textarea
                value={formState.explanation}
                onChange={(event) =>
                  updateFormField('explanation', event.target.value)
                }
                placeholder="Explanation visible after result only"
                rows={3}
                disabled={!canModifyExam || isSaving}
              />
            </label>

            <button
              type="submit"
              className="primary-button full-width-button"
              disabled={!canModifyExam || isSaving}
            >
              {isSaving ? (
                <Loader2 size={18} className="spin-icon" />
              ) : (
                <Save size={18} />
              )}
              Save Question
            </button>
          </form>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>Saved Questions</h2>
              <p>
                Review questions before publishing the exam for admin approval.
              </p>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={42} />
              <h3>No questions added</h3>
              <p>Add at least one question before publishing the exam.</p>
            </div>
          ) : (
            <div className="question-list">
              {questions.map((question, index) => (
                <article key={question.id} className="question-card">
                  <div className="question-card-header">
                    <div>
                      <p className="eyebrow">Question {index + 1}</p>
                      <h3>{question.question_text}</h3>
                    </div>

                    <span className="status-pill status-draft">
                      {question.marks} mark
                      {question.marks > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="option-list">
                    <p>
                      <strong>A.</strong> {question.option_a}
                    </p>
                    <p>
                      <strong>B.</strong> {question.option_b}
                    </p>
                    <p>
                      <strong>C.</strong> {question.option_c}
                    </p>
                    <p>
                      <strong>D.</strong> {question.option_d}
                    </p>
                  </div>

                  <div className="answer-preview">
                    <PlusCircle size={16} />
                    Correct Answer: Option {question.correct_option}
                  </div>

                  {question.explanation ? (
                    <p className="question-explanation">
                      Explanation: {question.explanation}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    className="danger-button"
                    disabled={!canModifyExam || deletingQuestionId === question.id}
                    onClick={() => void handleDeleteQuestion(question.id)}
                  >
                    {deletingQuestionId === question.id ? (
                      <Loader2 size={16} className="spin-icon" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  )
}

export default AddQuestionsPage