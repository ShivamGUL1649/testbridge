import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Brain,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react'

import { supabase } from '../lib/supabaseClient'
import type { UserProfile } from '../types'

type AdminAiTestGeneratorPageProps = {
  profile: UserProfile
}

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

type GenerateAiTestResponse = {
  message: string
  exam?: {
    id: string
    title: string
    status: string
  }
  totalQuestions?: number
  redirectPath?: string
}

type SupabaseFunctionError = {
  message?: string
  context?: Response
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const functionError = error as SupabaseFunctionError

  if (functionError?.context instanceof Response) {
    try {
      const responseText = await functionError.context.text()

      if (responseText) {
        try {
          const parsed = JSON.parse(responseText) as { message?: string }

          return parsed.message || responseText
        } catch {
          return responseText
        }
      }
    } catch {
      return functionError.message || 'Edge Function returned an error.'
    }
  }

  if (functionError?.message) {
    return functionError.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to generate AI test.'
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

  async function handleGenerateTest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage('')
    setSuccessMessage('')

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

    if (numberOfQuestions < 1 || numberOfQuestions > 70) {
      setErrorMessage('Number of questions must be between 1 and 70.')
      return
    }

    if (durationMinutes < 1 || durationMinutes > 180) {
      setErrorMessage('Duration must be between 1 and 180 minutes.')
      return
    }

    if (passingPercentage < 1 || passingPercentage > 100) {
      setErrorMessage('Passing percentage must be between 1 and 100.')
      return
    }

    setIsGenerating(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setErrorMessage('Your login session is missing. Please login again.')
        return
      }

      const { data, error } = await supabase.functions.invoke(
        'generate-ai-test',
        {
          body: {
            title: title.trim(),
            topic: topic.trim(),
            difficulty,
            numberOfQuestions,
            durationMinutes,
            passingPercentage,
            prompt: prompt.trim(),
          },
        },
      )

      if (error) {
        const detailedMessage = await getFunctionErrorMessage(error)
        setErrorMessage(detailedMessage)
        return
      }

      const response = data as GenerateAiTestResponse

      if (!response?.exam?.id) {
        setErrorMessage(response?.message || 'AI test generation failed.')
        return
      }

      setSuccessMessage(
        `${response.message} Created ${
          response.totalQuestions || numberOfQuestions
        } questions.`,
      )

      window.setTimeout(() => {
        navigate(
          response.redirectPath || `/admin/exam/${response.exam?.id}/questions`,
        )
      }, 1000)
    } catch (error) {
      const detailedMessage = await getFunctionErrorMessage(error)
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
            Generate a complete test using AI. The test will be saved as Draft,
            so Admin can review questions before publishing.
          </p>
        </div>

        <div className="dashboard-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate('/admin/exams/pending')}
          >
            <FileText size={18} />
            Manage Tests
          </button>
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
                  max={70}
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
                  max={180}
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
              {isGenerating ? 'Generating Test...' : 'Generate Test with AI'}
            </button>
          </form>
        </article>

        <article className="content-card">
          <div className="section-title-row">
            <div>
              <h2>How AI Test Generator Works</h2>
              <p>
                AI will perform the same basic work as a Test Creator, but Admin
                remains in control.
              </p>
            </div>
          </div>

          <div className="flow-list">
            <div className="flow-item">
              <strong>
                <Brain size={17} /> AI Generation
              </strong>
              <span>
                AI creates questions, options, correct answers and explanations.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <FileText size={17} /> Draft Test
              </strong>
              <span>
                Generated test is saved as Draft first for safe review.
              </span>
            </div>

            <div className="flow-item">
              <strong>
                <CheckCircle2 size={17} /> Admin Review
              </strong>
              <span>
                Admin can edit questions before publishing the test.
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
            Recommended MVP limit: maximum 70 questions per generation.
          </div>

          <div className="alert-message alert-error create-exam-note">
            <strong>Important:</strong>
            AI questions should always be reviewed by Admin before publishing.
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