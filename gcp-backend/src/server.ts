import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import { Firestore } from '@google-cloud/firestore'

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

type GenerateAiTestRequest = {
  title: string
  topic: string
  difficulty: Difficulty
  numberOfQuestions: number
  durationMinutes: number
  passingPercentage: number
  prompt: string

  categoryId?: string
  category_id?: string
  categorySlug?: string
  category_slug?: string
  categoryName?: string
  category_name?: string
  questionType?: string
  answerMode?: string
}

type NormalizedCategory = {
  categoryId: string
  categorySlug: string
  categoryName: string
}

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

const app = express()
const firestore = new Firestore()

app.use(cors())
app.use(express.json({ limit: '2mb' }))

const port = Number(process.env.PORT || 8080)

const maxQuestions = 100
const batchSize = 5
const maxBatchRetries = 3

function cleanString(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function normalizeCategory(body: GenerateAiTestRequest): NormalizedCategory {
  return {
    categoryId: cleanString(body.categoryId || body.category_id),
    categorySlug: cleanString(body.categorySlug || body.category_slug),
    categoryName:
      cleanString(body.categoryName || body.category_name) ||
      cleanString(body.topic),
  }
}

function validateRequest(body: GenerateAiTestRequest): string | null {
  if (!cleanString(body.title)) return 'Test title is required.'
  if (!cleanString(body.topic)) return 'Topic is required.'
  if (!cleanString(body.prompt)) return 'Prompt is required.'

  const category = normalizeCategory(body)

  if (!category.categoryId) {
    return 'Category is required. Please select a category before generating the AI test.'
  }

  if (!category.categorySlug) {
    return 'Category slug is required. Please select a valid category before generating the AI test.'
  }

  if (!category.categoryName) {
    return 'Category name is required. Please select a valid category before generating the AI test.'
  }

  if (!['Beginner', 'Intermediate', 'Advanced'].includes(body.difficulty)) {
    return 'Difficulty must be Beginner, Intermediate, or Advanced.'
  }

  if (
    !Number.isInteger(body.numberOfQuestions) ||
    body.numberOfQuestions < 1 ||
    body.numberOfQuestions > maxQuestions
  ) {
    return `Number of questions must be between 1 and ${maxQuestions}.`
  }

  if (
    !Number.isInteger(body.durationMinutes) ||
    body.durationMinutes < 1 ||
    body.durationMinutes > 240
  ) {
    return 'Duration must be between 1 and 240 minutes.'
  }

  if (
    !Number.isInteger(body.passingPercentage) ||
    body.passingPercentage < 1 ||
    body.passingPercentage > 100
  ) {
    return 'Passing percentage must be between 1 and 100.'
  }

  if (body.prompt.length > 6000) {
    return 'Prompt should not be more than 6000 characters.'
  }

  return null
}

function validateAdminKey(request: express.Request): boolean {
  const expectedKey = process.env.TESTBRIDGE_ADMIN_API_KEY
  const receivedKey = request.header('x-admin-key')

  if (!expectedKey) {
    return false
  }

  return receivedKey === expectedKey
}

function requireAdminKey(
  req: express.Request,
  res: express.Response,
): boolean {
  if (!validateAdminKey(req)) {
    res.status(401).json({
      message: 'Unauthorized. Invalid admin key.',
    })

    return false
  }

  return true
}

function buildBatchPrompt(
  body: GenerateAiTestRequest,
  batchQuestionCount: number,
  batchNumber: number,
  startQuestionNumber: number,
): string {
  return `
You are an expert exam creator and assessment architect.

Create exactly ${batchQuestionCount} high-quality multiple-choice questions.

Test Details:
- Test title: ${body.title}
- Topic: ${body.topic}
- Category: ${normalizeCategory(body).categoryName}
- Category slug: ${normalizeCategory(body).categorySlug}
- Difficulty: ${body.difficulty}
- Question type: Single Choice only
- Correct answers: Exactly one correct option per question
- Batch number: ${batchNumber}
- Start question number: ${startQuestionNumber}
- Question count in this batch: ${batchQuestionCount}

Quality Rules:
- Create scenario-based and practical questions aligned with the selected category.
- Avoid basic definition-only questions unless difficulty is Beginner.
- Wrong options must be realistic and close to the correct answer.
- Avoid obviously wrong options.
- Avoid repeated questions.
- Avoid ambiguous questions.
- For Advanced level, include troubleshooting, architecture decisions, edge cases, security, performance, and real project scenarios.
- Each question must have exactly 4 options.
- Only one correct answer per question.
- correct_option must be only A, B, C, or D.
- Add a clear explanation for every answer.
- Return only valid JSON.
- Do not add markdown.
- Do not add comments.
- Do not add trailing commas.
- Do not wrap JSON in code block.
- The questions array must contain exactly ${batchQuestionCount} objects.

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
  const selectedQuestions = questions.slice(0, expectedCount)

  if (selectedQuestions.length < expectedCount) {
    throw new Error(
      `AI generated ${selectedQuestions.length} questions, but expected ${expectedCount}.`,
    )
  }

  return selectedQuestions.map((question, index) => {
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

async function generateBatchWithOpenAI(
  body: GenerateAiTestRequest,
  batchQuestionCount: number,
  batchNumber: number,
  startQuestionNumber: number,
): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured.')
  }

  const openai = new OpenAI({
    apiKey,
  })

  let lastErrorMessage = ''

  for (let attempt = 1; attempt <= maxBatchRetries; attempt += 1) {
    try {
      const prompt = buildBatchPrompt(
        body,
        batchQuestionCount,
        batchNumber,
        startQuestionNumber,
      )

      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a strict JSON generator for professional assessment questions. Return only valid JSON.',
          },
          {
            role: 'user',
            content: `${prompt}

Important retry instruction:
This is attempt ${attempt}.
You must return exactly ${batchQuestionCount} questions in the questions array.`,
          },
        ],
        response_format: {
          type: 'json_object',
        },
      })

      const text = response.choices[0]?.message?.content?.trim() || ''

      if (!text) {
        throw new Error('OpenAI returned empty response.')
      }

      const parsed = extractJsonFromText(text)

      return validateGeneratedQuestions(parsed.questions, batchQuestionCount)
    } catch (error) {
      lastErrorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown AI batch generation error.'

      console.error(
        `Batch ${batchNumber} attempt ${attempt} failed: ${lastErrorMessage}`,
      )

      if (attempt < maxBatchRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
  }

  throw new Error(
    `Batch ${batchNumber} failed after ${maxBatchRetries} attempts. Last error: ${lastErrorMessage}`,
  )
}

async function saveQuestionsToFirestore(
  testId: string,
  questions: GeneratedQuestion[],
  startQuestionNumber: number,
): Promise<void> {
  const batch = firestore.batch()

  questions.forEach((question, index) => {
    const questionNumber = startQuestionNumber + index
    const questionRef = firestore
      .collection('ai_tests')
      .doc(testId)
      .collection('questions')
      .doc(String(questionNumber).padStart(3, '0'))

    batch.set(questionRef, {
      questionNumber,
      questionText: question.question_text,
      optionA: question.option_a,
      optionB: question.option_b,
      optionC: question.option_c,
      optionD: question.option_d,
      correctOption: question.correct_option,
      explanation: question.explanation,
      marks: question.marks || 1,
      createdAt: new Date().toISOString(),
    })
  })

  await batch.commit()
}

app.get('/', (_req, res) => {
  res.json({
    message: 'TestBridge GCP backend is running',
    status: 'OK',
  })
})

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
  })
})

app.get('/firestore-test', async (_req, res) => {
  try {
    const testDocRef = firestore.collection('system').doc('health-check')

    await testDocRef.set(
      {
        status: 'connected',
        service: 'testbridge-backend',
        updatedAt: new Date().toISOString(),
      },
      {
        merge: true,
      },
    )

    const snapshot = await testDocRef.get()

    res.json({
      message: 'Firestore connection successful',
      data: snapshot.data(),
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Firestore connection failed'

    res.status(500).json({
      message,
    })
  }
})

app.post('/api/ai-tests/generate', async (req, res) => {
  const body = req.body as GenerateAiTestRequest
  let testRef: FirebaseFirestore.DocumentReference | null = null

  try {
    if (!requireAdminKey(req, res)) return

    const validationError = validateRequest(body)

    if (validationError) {
      return res.status(400).json({
        message: validationError,
      })
    }

    const category = normalizeCategory(body)

    testRef = firestore.collection('ai_tests').doc()
    const testId = testRef.id

    await testRef.set({
      id: testId,
      title: body.title.trim(),
      topic: body.topic.trim(),
      difficulty: body.difficulty,
      numberOfQuestions: body.numberOfQuestions,
      durationMinutes: body.durationMinutes,
      passingPercentage: body.passingPercentage,
      prompt: body.prompt.trim(),

      categoryId: category.categoryId,
      category_id: category.categoryId,
      categorySlug: category.categorySlug,
      category_slug: category.categorySlug,
      categoryName: category.categoryName,
      category_name: category.categoryName,

      questionType: 'SINGLE_CHOICE',
      question_type: 'SINGLE_CHOICE',
      answerMode: 'ONE_CORRECT_ANSWER',
      answer_mode: 'ONE_CORRECT_ANSWER',

      status: 'GENERATING',
      generatedQuestions: 0,
      failedReason: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    let remainingQuestions = body.numberOfQuestions
    let batchNumber = 1
    let startQuestionNumber = 1
    let generatedQuestions = 0

    while (remainingQuestions > 0) {
      const batchQuestionCount = Math.min(batchSize, remainingQuestions)

      const generatedBatch = await generateBatchWithOpenAI(
        body,
        batchQuestionCount,
        batchNumber,
        startQuestionNumber,
      )

      await saveQuestionsToFirestore(
        testId,
        generatedBatch,
        startQuestionNumber,
      )

      generatedQuestions += generatedBatch.length
      remainingQuestions -= batchQuestionCount
      batchNumber += 1
      startQuestionNumber += batchQuestionCount

      await testRef.update({
        generatedQuestions,
        updatedAt: new Date().toISOString(),
      })
    }

    await testRef.update({
      status: 'DRAFT',
      generatedQuestions,
      updatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })

    return res.json({
      message: 'AI test generated successfully.',
      testId,
      totalQuestions: generatedQuestions,
      status: 'DRAFT',
      category: {
        id: category.categoryId,
        slug: category.categorySlug,
        name: category.categoryName,
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to generate AI test.'

    console.error('AI test generation failed:', message)

    if (testRef) {
      await testRef.update({
        status: 'FAILED',
        failedReason: message,
        updatedAt: new Date().toISOString(),
      })
    }

    return res.status(500).json({
      message,
    })
  }
})

app.get('/api/ai-tests', async (req, res) => {
  try {
    if (!requireAdminKey(req, res)) return

    const snapshot = await firestore
      .collection('ai_tests')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const tests = snapshot.docs.map((doc) => {
      const data = doc.data()

      return {
        id: doc.id,
        title: data.title || '',
        topic: data.topic || '',
        difficulty: data.difficulty || '',
        numberOfQuestions: data.numberOfQuestions || 0,
        durationMinutes: data.durationMinutes || 0,
        passingPercentage: data.passingPercentage || 0,
        categoryId: data.categoryId || data.category_id || '',
        category_id: data.category_id || data.categoryId || '',
        categorySlug: data.categorySlug || data.category_slug || '',
        category_slug: data.category_slug || data.categorySlug || '',
        categoryName: data.categoryName || data.category_name || '',
        category_name: data.category_name || data.categoryName || '',
        questionType: data.questionType || data.question_type || 'SINGLE_CHOICE',
        answerMode: data.answerMode || data.answer_mode || 'ONE_CORRECT_ANSWER',
        status: data.status || '',
        generatedQuestions: data.generatedQuestions || 0,
        failedReason: data.failedReason || '',
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
        completedAt: data.completedAt || '',
      }
    })

    return res.json({
      tests,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load AI tests.'

    return res.status(500).json({
      message,
    })
  }
})

app.get('/api/ai-tests/:testId', async (req, res) => {
  try {
    if (!requireAdminKey(req, res)) return

    const testId = cleanString(req.params.testId)

    if (!testId) {
      return res.status(400).json({
        message: 'Test ID is required.',
      })
    }

    const snapshot = await firestore.collection('ai_tests').doc(testId).get()

    if (!snapshot.exists) {
      return res.status(404).json({
        message: 'AI test not found.',
      })
    }

    return res.json({
      test: {
        id: snapshot.id,
        ...snapshot.data(),
      },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load AI test.'

    return res.status(500).json({
      message,
    })
  }
})

app.get('/api/ai-tests/:testId/questions', async (req, res) => {
  try {
    if (!requireAdminKey(req, res)) return

    const testId = cleanString(req.params.testId)

    if (!testId) {
      return res.status(400).json({
        message: 'Test ID is required.',
      })
    }

    const testSnapshot = await firestore.collection('ai_tests').doc(testId).get()

    if (!testSnapshot.exists) {
      return res.status(404).json({
        message: 'AI test not found.',
      })
    }

    const questionSnapshot = await firestore
      .collection('ai_tests')
      .doc(testId)
      .collection('questions')
      .orderBy('questionNumber', 'asc')
      .get()

    const questions = questionSnapshot.docs.map((doc) => {
      const data = doc.data()

      return {
        id: doc.id,
        questionNumber: data.questionNumber || 0,
        questionText: data.questionText || '',
        optionA: data.optionA || '',
        optionB: data.optionB || '',
        optionC: data.optionC || '',
        optionD: data.optionD || '',
        correctOption: data.correctOption || '',
        explanation: data.explanation || '',
        marks: data.marks || 1,
        createdAt: data.createdAt || '',
      }
    })

    return res.json({
      test: {
        id: testSnapshot.id,
        ...testSnapshot.data(),
      },
      questions,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to load AI test questions.'

    return res.status(500).json({
      message,
    })
  }
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${port}`)
})