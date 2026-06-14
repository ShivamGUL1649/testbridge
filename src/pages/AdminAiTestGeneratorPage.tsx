import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Brain,
  CheckCircle2,
  Clock,
  Database,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react'

import type { UserProfile } from '../types'

type AdminAiTestGeneratorPageProps = {
  profile: UserProfile
}

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

type GenerateAiTestResponse = {
  message: string
  testId?: string
  totalQuestions?: number
  status?: string
}

const gcpBackendBaseUrl = 'https://testbridge-backend-ukm3galdsq-el.a.run.app'
const adminApiKey = 'testbridge-admin-2026'

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

function AdminAiTestGeneratorPage({
  profile,
}: AdminAiTestGeneratorPageProps) {
  const navigate = useNavigate()

  const [title, setTitle] = useState('GCP Practice Test')
  const [topic, setTopic] = useState('Google Cloud Platform')
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate')
  const [numberOfQuestions, setNumberOfQuestions] = useState(10)
  const [durationMinutes, setDurationMinutes] = useState(15)
  const [passingPercentage, setPassingPercentage] = useState(70)
  const [prompt, setPrompt] = useState(
    'Create certification-style multiple choice questions. Focus on practical concepts, real-world scenarios, and clear explanations.',
  )

  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [generatedTestId, setGeneratedTestId] = useState('')

  async function handleGenerateTest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')
    setGeneratedTestId('')

    if (!title.trim()) {
      setErrorMessage('Test title is required.')
      return
    }

    if (!topic.trim()) {
      setErrorMessage('Topic is required.')
      return
    }

    if (!prompt.trim()) {
      setErrorMessage('Prompt is required.')
      return
    }

    if (numberOfQuestions < 1 || numberOfQuestions > 100) {
      setErrorMessage('Number of questions must be between 1 and 100.')
      return
    }

    if (durationMinutes < 1 || durationMinutes > 240) {
      setErrorMessage('Duration must be between 1 and 240 minutes.')
      return
    }

    if (passingPercentage < 1 || passingPercentage > 100) {
      setErrorMessage('Passing percentage must be between 1 and 100.')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch(
        `${gcpBackendBaseUrl}/api/ai-tests/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-key': adminApiKey,
          },
          body: JSON.stringify({
            title: title.trim(),
            topic: topic.trim(),
            difficulty,
            numberOfQuestions,
            durationMinutes,
            passingPercentage,
            prompt: prompt.trim(),
          }),
        },
      )

      if (!response.ok) {
        const detailedMessage = await getApiErrorMessage(response)
        setErrorMessage(detailedMessage)
        return
      }

      const data = (await response.json()) as GenerateAiTestResponse

      if (!data?.testId) {
        setErrorMessage(data?.message || 'AI test generation failed.')
        return
      }

      setGeneratedTestId(data.testId)

      setSuccessMessage(
        `${data.message} Created ${
          data.totalQuestions || numberOfQuestions
        } questions in Firestore. Status: ${data.status || 'DRAFT'}.`,
      )
    } catch (error) {
      const detailedMessage =
        error instanceof Error
          ? error.message
          : 'Unable to connect with GCP Cloud Run backend.'

      setErrorMessage(detailedMessage)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Admin AI Control</p>
          <h1>AI Test Generator</h1>
          <p>
            Generate a complete test using GCP Cloud Run and OpenAI. The test
            will be saved in Google Firestore as Draft for Admin review.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/admin/exams/pending')}
          >
            <FileText size={18} />
            Manage Published Tests
          </button>
        </div>
      </section>

      {errorMessage ? (
        <div className="alert-message alert-error">{errorMessage}</div>
      ) : null}

      {successMessage ? (
        <div className="alert-message alert-success">
          <div>{successMessage}</div>

          {generatedTestId ? (
            <div className="create-exam-note">
              <strong>Firestore Test ID:</strong> {generatedTestId}
            </div>
          ) : null}
        </div>
      ) : null}

      <section className="content-grid two-column-grid">
        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>Create Test with AI</h2>
              <p>
                Enter topic, question count, difficulty and instructions for AI.
              </p>
            </div>
          </div>

          <form className="form-card" onSubmit={handleGenerateTest}>
            <label className="form-field">
              <span>Test Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Example: GCP Practice Test"
                disabled={isGenerating}
              />
            </label>

            <label className="form-field">
              <span>Topic</span>
              <input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Example: Google Cloud Platform"
                disabled={isGenerating}
              />
            </label>

            <label className="form-field">
              <span>Difficulty</span>
              <select
                value={difficulty}
                onChange={(event) =>
                  setDifficulty(event.target.value as Difficulty)
                }
                disabled={isGenerating}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </label>

            <div className="form-grid">
              <label className="form-field">
                <span>Number of Questions</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={numberOfQuestions}
                  onChange={(event) =>
                    setNumberOfQuestions(Number(event.target.value))
                  }
                  disabled={isGenerating}
                />
              </label>

              <label className="form-field">
                <span>Duration Minutes</span>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={durationMinutes}
                  onChange={(event) =>
                    setDurationMinutes(Number(event.target.value))
                  }
                  disabled={isGenerating}
                />
              </label>
            </div>

            <label className="form-field">
              <span>Passing Percentage</span>
              <input
                type="number"
                min={1}
                max={100}
                value={passingPercentage}
                onChange={(event) =>
                  setPassingPercentage(Number(event.target.value))
                }
                disabled={isGenerating}
              />
            </label>

            <label className="form-field">
              <span>AI Prompt / Instructions</span>
              <textarea
                rows={6}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe what type of questions AI should create"
                disabled={isGenerating}
              />
            </label>

            <button
              type="submit"
              className="primary-button full-width-button"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 size={18} className="spin-icon" />
              ) : (
                <Sparkles size={18} />
              )}
              {isGenerating
                ? 'Generating Test in Firestore...'
                : 'Generate Test with AI'}
            </button>
          </form>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>How AI Test Generator Works</h2>
              <p>
                AI will create draft tests in Firestore. Admin remains in
                control before publishing to Test Takers.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <Brain size={17} /> AI Generation
              </strong>
              <span>
                Admin request goes from TestBridge UI to GCP Cloud Run.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <Sparkles size={17} /> OpenAI Processing
              </strong>
              <span>
                OpenAI creates questions, options, correct answers and
                explanations.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <Database size={17} /> Firestore Draft
              </strong>
              <span>
                Generated test is saved in Firestore collection ai_tests.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <CheckCircle2 size={17} /> Admin Review
              </strong>
              <span>
                Admin should review generated questions before publishing.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <Clock size={17} /> Cost Control
              </strong>
              <span>
                AI cost applies only when this Generate button is clicked.
              </span>
            </div>
          </div>

          <div className="alert-message alert-success create-exam-note">
            <Sparkles size={18} />
            Current MVP limit: maximum 100 questions per generation.
          </div>

          <div className="alert-message alert-error create-exam-note">
            <strong>Important:</strong>
            Generated tests are currently saved in Firestore only. They are not
            yet copied to Supabase published tests.
          </div>

          <div className="placeholder-card">
            <p className="eyebrow">Logged in Admin</p>
            <h2>{profile.name}</h2>
            <p>{profile.email}</p>
          </div>
        </article>
      </section>
    </main>
  )
}

export default AdminAiTestGeneratorPage