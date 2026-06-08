// @ts-ignore: Supabase Edge Functions support remote URL imports through Deno runtime.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

declare const Deno: {
  env: {
    get(name: string): string | undefined
  }
  serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void
}

type AiDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

type GeneratedQuestion = {
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'A' | 'B' | 'C' | 'D'
  explanation: string
  marks?: number
}

type GenerateAiTestRequest = {
  title: string
  topic: string
  difficulty: AiDifficulty
  numberOfQuestions: number
  durationMinutes: number
  passingPercentage: number
  prompt: string
}

type OpenAiChatResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const MAX_QUESTIONS = 50
const BATCH_SIZE = 10
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

function getRequiredEnv(name: string): string {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`${name} is not configured.`)
  }

  return value
}

function cleanString(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function validateRequest(body: GenerateAiTestRequest): string | null {
  const title = cleanString(body.title)
  const topic = cleanString(body.topic)
  const prompt = cleanString(body.prompt)

  if (!title) return 'Test title is required.'
  if (!topic) return 'Topic is required.'
  if (!prompt) return 'Prompt is required.'

  if (!['Beginner', 'Intermediate', 'Advanced'].includes(body.difficulty)) {
    return 'Difficulty must be Beginner, Intermediate, or Advanced.'
  }

  if (
    !Number.isInteger(body.numberOfQuestions) ||
    body.numberOfQuestions < 1 ||
    body.numberOfQuestions > MAX_QUESTIONS
  ) {
    return `Number of questions must be between 1 and ${MAX_QUESTIONS}.`
  }

  if (
    !Number.isInteger(body.durationMinutes) ||
    body.durationMinutes < 1 ||
    body.durationMinutes > 180
  ) {
    return 'Duration must be between 1 and 180 minutes.'
  }

  if (
    !Number.isInteger(body.passingPercentage) ||
    body.passingPercentage < 1 ||
    body.passingPercentage > 100
  ) {
    return 'Passing percentage must be between 1 and 100.'
  }

  if (prompt.length > 1800) {
    return 'Prompt should not be more than 1800 characters.'
  }

  return null
}

function extractJsonFromText(text: string): {
  questions: GeneratedQuestion[]
} {
  const cleanedText = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const firstBraceIndex = cleanedText.indexOf('{')
  const lastBraceIndex = cleanedText.lastIndexOf('}')

  if (firstBraceIndex === -1 || lastBraceIndex === -1) {
    throw new Error('AI response did not contain valid JSON.')
  }

  const jsonText = cleanedText.slice(firstBraceIndex, lastBraceIndex + 1)
  const parsed = JSON.parse(jsonText)

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('AI response JSON is invalid.')
  }

  if (!Array.isArray(parsed.questions)) {
    throw new Error('AI response does not contain questions array.')
  }

  return {
    questions: parsed.questions,
  }
}

function validateGeneratedQuestions(
  questions: GeneratedQuestion[],
  expectedCount: number,
): GeneratedQuestion[] {
  if (questions.length !== expectedCount) {
    throw new Error(
      `AI generated ${questions.length} questions, but expected ${expectedCount}. Please try again.`,
    )
  }

  return questions.map((question, index) => {
    const questionText = cleanString(question.question_text)
    const optionA = cleanString(question.option_a)
    const optionB = cleanString(question.option_b)
    const optionC = cleanString(question.option_c)
    const optionD = cleanString(question.option_d)
    const correctOption = cleanString(question.correct_option).toUpperCase()
    const explanation = cleanString(question.explanation)

    if (!questionText) {
      throw new Error(`Question ${index + 1} is missing question text.`)
    }

    if (!optionA || !optionB || !optionC || !optionD) {
      throw new Error(`Question ${index + 1} is missing one or more options.`)
    }

    if (!['A', 'B', 'C', 'D'].includes(correctOption)) {
      throw new Error(
        `Question ${index + 1} has invalid correct option. Allowed values are A, B, C, D.`,
      )
    }

    return {
      question_text: questionText,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption as 'A' | 'B' | 'C' | 'D',
      explanation:
        explanation ||
        'Explanation was not provided by AI. Please review this question.',
      marks:
        Number.isInteger(question.marks) && Number(question.marks) > 0
          ? Number(question.marks)
          : 1,
    }
  })
}

function buildBatchPrompt(
  body: GenerateAiTestRequest,
  batchQuestionCount: number,
  batchNumber: number,
  startQuestionNumber: number,
): string {
  return `
You are an expert assessment creator.

Create only ${batchQuestionCount} multiple-choice questions.

Test Details:
- Topic: ${body.topic}
- Difficulty: ${body.difficulty}
- Batch number: ${batchNumber}
- Start question number: ${startQuestionNumber}
- Question count in this batch: ${batchQuestionCount}

Rules:
- Each question must have exactly 4 options.
- Only one correct answer per question.
- correct_option must be only A, B, C, or D.
- Add short explanation for every answer.
- Avoid duplicate questions.
- Avoid ambiguous questions.
- Return only valid JSON.
- Do not add markdown.
- Do not add comments.
- Do not add trailing comma.
- Do not wrap JSON in code block.

Admin instruction:
${body.prompt}

Return JSON in this exact format:
{
  "questions": [
    {
      "question_text": "Question text",
      "option_a": "Option A",
      "option_b": "Option B",
      "option_c": "Option C",
      "option_d": "Option D",
      "correct_option": "A",
      "explanation": "Short explanation",
      "marks": 1
    }
  ]
}
`.trim()
}

async function sleep(milliseconds: number): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

async function callOpenAi(prompt: string, retryCount = 0): Promise<string> {
  const openAiApiKey = getRequiredEnv('OPENAI_API_KEY')
  const openAiModel = Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini'

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: openAiModel,
      messages: [
        {
          role: 'system',
          content:
            'You are a strict JSON generator for assessment questions. Return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: {
        type: 'json_object',
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()

    if (
      (response.status === 429 || response.status >= 500) &&
      retryCount < 2
    ) {
      await sleep(2000 * (retryCount + 1))
      return callOpenAi(prompt, retryCount + 1)
    }

    throw new Error(`OpenAI API failed: ${errorText}`)
  }

  const data = (await response.json()) as OpenAiChatResponse

  const text = data.choices?.[0]?.message?.content?.trim() || ''

  if (!text) {
    throw new Error('OpenAI returned empty response.')
  }

  return text
}

async function generateQuestionsInBatches(
  body: GenerateAiTestRequest,
): Promise<GeneratedQuestion[]> {
  const allQuestions: GeneratedQuestion[] = []
  let remainingQuestions = body.numberOfQuestions
  let batchNumber = 1
  let startQuestionNumber = 1

  while (remainingQuestions > 0) {
    const batchQuestionCount = Math.min(BATCH_SIZE, remainingQuestions)

    const batchPrompt = buildBatchPrompt(
      body,
      batchQuestionCount,
      batchNumber,
      startQuestionNumber,
    )

    const aiText = await callOpenAi(batchPrompt)
    const parsedAiResult = extractJsonFromText(aiText)

    const validatedBatchQuestions = validateGeneratedQuestions(
      parsedAiResult.questions,
      batchQuestionCount,
    )

    allQuestions.push(...validatedBatchQuestions)

    remainingQuestions -= batchQuestionCount
    batchNumber += 1
    startQuestionNumber += batchQuestionCount
  }

  if (allQuestions.length !== body.numberOfQuestions) {
    throw new Error(
      `AI generated ${allQuestions.length} questions, but expected ${body.numberOfQuestions}. Please try again.`,
    )
  }

  return allQuestions
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    })
  }

  if (request.method !== 'POST') {
    return jsonResponse(
      {
        message: 'Only POST method is allowed.',
      },
      405,
    )
  }

  try {
    const supabaseUrl = getRequiredEnv('SUPABASE_URL')
    const supabaseAnonKey = getRequiredEnv('SUPABASE_ANON_KEY')
    const supabaseServiceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY')

    const authorizationHeader = request.headers.get('Authorization') || ''

    if (!authorizationHeader) {
      return jsonResponse(
        {
          message: 'Authorization header is required.',
        },
        401,
      )
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorizationHeader,
        },
      },
    })

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return jsonResponse(
        {
          message: 'Invalid user session.',
        },
        401,
      )
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, auth_user_id, name, email, role')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError || !profile) {
      return jsonResponse(
        {
          message: 'User profile not found.',
        },
        404,
      )
    }

    if (profile.role !== 'ADMIN') {
      return jsonResponse(
        {
          message: 'Only Admin can generate tests with AI.',
        },
        403,
      )
    }

    const body = (await request.json()) as GenerateAiTestRequest
    const validationError = validateRequest(body)

    if (validationError) {
      return jsonResponse(
        {
          message: validationError,
        },
        400,
      )
    }

    const validatedQuestions = await generateQuestionsInBatches(body)

    const testDescription = `AI generated ${body.difficulty.toLowerCase()} level test on ${body.topic}. Please review before publishing.`

    const { data: createdExam, error: examError } = await adminClient
      .from('exams')
      .insert({
        title: body.title.trim(),
        description: testDescription,
        total_time_minutes: body.durationMinutes,
        passing_marks: body.passingPercentage,
        status: 'DRAFT',
        created_by: profile.id,
      })
      .select('id, title, status')
      .single()

    if (examError || !createdExam) {
      throw new Error(
        examError?.message || 'Unable to create AI generated test.',
      )
    }

    const questionPayload = validatedQuestions.map((question, index) => ({
      exam_id: createdExam.id,
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
      explanation: question.explanation,
      marks: question.marks || 1,
      question_order: index + 1,
    }))

    const { error: questionsError } = await adminClient
      .from('exam_questions')
      .insert(questionPayload)

    if (questionsError) {
      await adminClient.from('exams').delete().eq('id', createdExam.id)
      throw new Error(questionsError.message)
    }

    return jsonResponse({
      message: 'AI test generated successfully.',
      exam: createdExam,
      totalQuestions: validatedQuestions.length,
      redirectPath: `/admin/exam/${createdExam.id}/questions`,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to generate AI test.'

    return jsonResponse(
      {
        message,
      },
      500,
    )
  }
})