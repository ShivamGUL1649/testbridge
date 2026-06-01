import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Edit3,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Save,
  Send,
  Trash2,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type AddQuestionsPageProps = {
  profile: UserProfile
}

type OptionKey = 'A' | 'B' | 'C' | 'D'

type ExamStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'

type ExamDetails = {
  id: string
  title: string
  description: string | null
  total_time_minutes: number
  passing_marks: number
  status: ExamStatus
  created_by: string
  created_at: string
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

const emptyForm: QuestionFormState = {
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
  const { examId } = useParams()
  const navigate = useNavigate()

  const [exam, setExam] = useState<ExamDetails | null>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [form, setForm] = useState<QuestionFormState>(emptyForm)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isDeletingQuestionId, setIsDeletingQuestionId] = useState<string | null>(
    null,
  )

  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isAdmin = profile.role === 'ADMIN'
  const isTutor = profile.role === 'TUTOR'

  const backLink = isAdmin ? '/admin/exams/pending' : '/tutor/exams'
  const backLabel = isAdmin ? 'Back to Admin Exams' : 'Back to My Exams'

  function updateFormField<Key extends keyof QuestionFormState>(
    key: Key,
    value: QuestionFormState[Key],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingQuestionId(null)
  }

  function validateQuestionForm(): string | null {
    if (!form.questionText.trim()) return 'Question text is required.'
    if (!form.optionA.trim()) return 'Option A is required.'
    if (!form.optionB.trim()) return 'Option B is required.'
    if (!form.optionC.trim()) return 'Option C is required.'
    if (!form.optionD.trim()) return 'Option D is required.'

    const marks = Number(form.marks)

    if (!Number.isFinite(marks) || marks <= 0) {
      return 'Marks must be greater than 0.'
    }

    return null
  }

  async function loadExamAndQuestions() {
    if (!examId) {
      setErrorMessage('Exam ID is missing.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const examQuery = supabase
        .from('exams')
        .select(
          'id, title, description, total_time_minutes, passing_marks, status, created_by, created_at',
        )
        .eq('id', examId)

      if (isTutor) {
        examQuery.eq('created_by', profile.id)
      }

      const examResponse = await examQuery.single()

      if (examResponse.error) {
        setErrorMessage(examResponse.error.message)
        setExam(null)
        setQuestions([])
        return
      }

      const questionsResponse = await supabase
        .from('exam_questions')
        .select(
          'id, exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, marks, question_order, created_at',
        )
        .eq('exam_id', examId)
        .order('question_order', { ascending: true })

      if (questionsResponse.error) {
        setErrorMessage(questionsResponse.error.message)
        setExam(examResponse.data as ExamDetails)
        setQuestions([])
        return
      }

      setExam(examResponse.data as ExamDetails)
      setQuestions((questionsResponse.data ?? []) as ExamQuestion[])
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to load exam questions.'

      setErrorMessage(message)
      setExam(null)
      setQuestions([])
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!examId || !exam) {
      setErrorMessage('Exam details are missing.')
      return
    }

    const validationError = validateQuestionForm()

    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setSuccessMessage('')

    const payload = {
      exam_id: examId,
      question_text: form.questionText.trim(),
      option_a: form.optionA.trim(),
      option_b: form.optionB.trim(),
      option_c: form.optionC.trim(),
      option_d: form.optionD.trim(),
      correct_option: form.correctOption,
      explanation: form.explanation.trim() || null,
      marks: Number(form.marks),
      question_order:
        editingQuestionId === null ? questions.length + 1 : undefined,
    }

    try {
      if (editingQuestionId) {
        const { error } = await supabase
          .from('exam_questions')
          .update({
            question_text: payload.question_text,
            option_a: payload.option_a,
            option_b: payload.option_b,
            option_c: payload.option_c,
            option_d: payload.option_d,
            correct_option: payload.correct_option,
            explanation: payload.explanation,
            marks: payload.marks,
          })
          .eq('id', editingQuestionId)
          .eq('exam_id', examId)

        if (error) {
          setErrorMessage(error.message)
          return
        }

        setSuccessMessage('Question updated successfully.')
      } else {
        const { error } = await supabase.from('exam_questions').insert(payload)

        if (error) {
          setErrorMessage(error.message)
          return
        }

        setSuccessMessage('Question added successfully.')
      }

      resetForm()
      await loadExamAndQuestions()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save question.'

      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleEditQuestion(question: ExamQuestion) {
    setEditingQuestionId(question.id)
    setForm({
      questionText: question.question_text,
      optionA: question.option_a,
      optionB: question.option_b,
      optionC: question.option_c,
      optionD: question.option_d,
      correctOption: question.correct_option,
      explanation: question.explanation ?? '',
      marks: String(question.marks),
    })

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function handleDeleteQuestion(question: ExamQuestion) {
    const confirmed = window.confirm(
      `Are you sure you want to delete this question?\n\n${question.question_text}`,
    )

    if (!confirmed) return

    setIsDeletingQuestionId(question.id)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('exam_questions')
        .delete()
        .eq('id', question.id)
        .eq('exam_id', question.exam_id)

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage('Question deleted successfully.')
      await loadExamAndQuestions()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to delete question.'

      setErrorMessage(message)
    } finally {
      setIsDeletingQuestionId(null)
    }
  }

  async function handlePublishForApproval() {
    if (!examId) return

    if (questions.length === 0) {
      setErrorMessage('Please add at least one question before publishing.')
      return
    }

    setIsPublishing(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const { error } = await supabase
        .from('exams')
        .update({
          status: 'PENDING_APPROVAL',
          updated_at: new Date().toISOString(),
        })
        .eq('id', examId)
        .eq('created_by', profile.id)

      if (error) {
        setErrorMessage(error.message)
        return
      }

      setSuccessMessage('Exam published for admin approval.')
      await loadExamAndQuestions()
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to publish exam for approval.'

      setErrorMessage(message)
    } finally {
      setIsPublishing(false)
    }
  }

  useEffect(() => {
    void loadExamAndQuestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, profile.id, profile.role])

  if (isLoading) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <Loader2 size={34} className="spin-icon" />
          <h1>Loading Questions</h1>
          <p>Please wait while we load exam questions.</p>
        </section>
      </main>
    )
  }

  if (errorMessage && !exam) {
    return (
      <main className="page-shell">
        <section className="placeholder-card error-card">
          <AlertTriangle size={42} />
          <h1>Unable to Load Exam</h1>
          <p>{errorMessage}</p>

          <button
            type="button"
            className="primary-button"
            onClick={() => void loadExamAndQuestions()}
          >
            Retry
          </button>
        </section>
      </main>
    )
  }

  if (!exam) {
    return (
      <main className="page-shell">
        <section className="placeholder-card">
          <AlertTriangle size={42} />
          <h1>Exam Not Found</h1>
          <p>This exam does not exist or you do not have permission.</p>

          <Link to={backLink} className="primary-button">
            {backLabel}
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">
            {isAdmin ? 'Admin Exam Editor' : 'Tutor Exam Editor'}
          </p>
          <h1>{exam.title}</h1>
          <p>
            {isAdmin
              ? 'Admin can edit questions for any exam.'
              : 'You can add, edit, or delete questions for tests created by you.'}
          </p>
        </div>

        <div className="dashboard-actions">
          <Link to={backLink} className="secondary-button">
            <ArrowLeft size={18} />
            {backLabel}
          </Link>

          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadExamAndQuestions()}
          >
            <RefreshCcw size={18} />
            Refresh
          </button>

          {isTutor && (exam.status === 'DRAFT' || exam.status === 'REJECTED') ? (
            <button
              type="button"
              className="primary-button"
              disabled={isPublishing}
              onClick={() => void handlePublishForApproval()}
            >
              {isPublishing ? (
                <Loader2 size={18} className="spin-icon" />
              ) : (
                <Send size={18} />
              )}
              {isPublishing ? 'Publishing...' : 'Publish for Approval'}
            </button>
          ) : null}
        </div>
      </section>

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="alert-message alert-success">{successMessage}</div>
      ) : null}

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>{editingQuestionId ? 'Edit Question' : 'Add Question'}</h2>
              <p>
                Add question text, four options, correct answer, marks, and
                explanation.
              </p>
            </div>
          </div>

          <form className="form-card" onSubmit={handleSaveQuestion}>
            <label className="form-field">
              <span>Question Text</span>
              <textarea
                value={form.questionText}
                onChange={(event) =>
                  updateFormField('questionText', event.target.value)
                }
                placeholder="Enter question"
                rows={4}
                disabled={isSaving}
              />
            </label>

            <div className="form-grid">
              <label className="form-field">
                <span>Option A</span>
                <input
                  value={form.optionA}
                  onChange={(event) =>
                    updateFormField('optionA', event.target.value)
                  }
                  placeholder="Option A"
                  disabled={isSaving}
                />
              </label>

              <label className="form-field">
                <span>Option B</span>
                <input
                  value={form.optionB}
                  onChange={(event) =>
                    updateFormField('optionB', event.target.value)
                  }
                  placeholder="Option B"
                  disabled={isSaving}
                />
              </label>

              <label className="form-field">
                <span>Option C</span>
                <input
                  value={form.optionC}
                  onChange={(event) =>
                    updateFormField('optionC', event.target.value)
                  }
                  placeholder="Option C"
                  disabled={isSaving}
                />
              </label>

              <label className="form-field">
                <span>Option D</span>
                <input
                  value={form.optionD}
                  onChange={(event) =>
                    updateFormField('optionD', event.target.value)
                  }
                  placeholder="Option D"
                  disabled={isSaving}
                />
              </label>
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>Correct Answer</span>
                <select
                  value={form.correctOption}
                  onChange={(event) =>
                    updateFormField(
                      'correctOption',
                      event.target.value as OptionKey,
                    )
                  }
                  disabled={isSaving}
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
                  value={form.marks}
                  onChange={(event) =>
                    updateFormField('marks', event.target.value)
                  }
                  disabled={isSaving}
                />
              </label>
            </div>

            <label className="form-field">
              <span>Explanation</span>
              <textarea
                value={form.explanation}
                onChange={(event) =>
                  updateFormField('explanation', event.target.value)
                }
                placeholder="Explanation shown only after result review"
                rows={4}
                disabled={isSaving}
              />
            </label>

            <div className="exam-card-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 size={18} className="spin-icon" />
                ) : editingQuestionId ? (
                  <Save size={18} />
                ) : (
                  <PlusCircle size={18} />
                )}
                {isSaving
                  ? 'Saving...'
                  : editingQuestionId
                    ? 'Update Question'
                    : 'Add Question'}
              </button>

              {editingQuestionId ? (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isSaving}
                  onClick={resetForm}
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>Exam Summary</h2>
              <p>Basic details and current question count.</p>
            </div>
          </div>

          <div className="exam-meta-grid">
            <div>
              <span>Status</span>
              <strong>{exam.status}</strong>
            </div>

            <div>
              <span>Total Time</span>
              <strong>{exam.total_time_minutes} minutes</strong>
            </div>

            <div>
              <span>Passing Percentage</span>
              <strong>{exam.passing_marks}%</strong>
            </div>

            <div>
              <span>Total Questions</span>
              <strong>{questions.length}</strong>
            </div>
          </div>

          <div className="alert-message alert-success create-exam-note">
            <ClipboardList size={18} />
            Correct answers and explanations are visible only after the student
            submits the exam.
          </div>
        </article>
      </section>

      <section className="question-list">
        {questions.length === 0 ? (
          <section className="placeholder-card">
            <ClipboardList size={42} />
            <h2>No questions added yet</h2>
            <p>Add the first question using the form above.</p>
          </section>
        ) : (
          questions.map((question, index) => {
            const isDeleting = isDeletingQuestionId === question.id

            return (
              <article className="question-card" key={question.id}>
                <div className="question-header">
                  <div>
                    <p className="eyebrow">Question {index + 1}</p>
                    <h2>{question.question_text}</h2>
                  </div>

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
                      <div
                        className={
                          question.correct_option === optionKey
                            ? 'option-card option-card-correct'
                            : 'option-card'
                        }
                        key={optionKey}
                      >
                        <span className="option-key">{optionKey}</span>
                        <span>{optionText}</span>

                        {question.correct_option === optionKey ? (
                          <strong className="option-badge correct-badge">
                            Correct Answer
                          </strong>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                <div className="explanation-card">
                  <strong>Explanation:</strong>
                  <p>
                    {question.explanation ||
                      'No explanation was added for this question.'}
                  </p>
                </div>

                <div className="exam-card-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleEditQuestion(question)}
                  >
                    <Edit3 size={18} />
                    Edit Question
                  </button>

                  <button
                    type="button"
                    className="danger-button"
                    disabled={isDeleting}
                    onClick={() => void handleDeleteQuestion(question)}
                  >
                    {isDeleting ? (
                      <Loader2 size={18} className="spin-icon" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    {isDeleting ? 'Deleting...' : 'Delete Question'}
                  </button>
                </div>
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}

export default AddQuestionsPage