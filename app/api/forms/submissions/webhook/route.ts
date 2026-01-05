import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/forms/submissions/webhook - Receive submissions from portal
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKey = request.headers.get('X-API-Key')
    const expectedApiKey = process.env.TCN_PORTAL_API_KEY

    if (!apiKey || apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { formId, submittedAt, submitter, responses } = body

    // Validate required fields
    if (!formId) {
      return NextResponse.json(
        { error: 'formId is required' },
        { status: 400 }
      )
    }

    if (!submitter || !submitter.name) {
      return NextResponse.json(
        { error: 'submitter.name is required' },
        { status: 400 }
      )
    }

    if (!responses || typeof responses !== 'object') {
      return NextResponse.json(
        { error: 'responses object is required' },
        { status: 400 }
      )
    }

    // Verify form exists
    const form = await prisma.signUpForm.findUnique({
      where: { id: formId },
      include: {
        _count: { select: { submissions: true } }
      }
    })

    if (!form) {
      return NextResponse.json(
        { error: 'Form not found' },
        { status: 404 }
      )
    }

    // Check if form is still active
    if (!form.isActive) {
      return NextResponse.json(
        { error: 'Form is no longer accepting submissions' },
        { status: 400 }
      )
    }

    // Check deadline
    if (form.deadline && new Date() > form.deadline) {
      return NextResponse.json(
        { error: 'Form deadline has passed' },
        { status: 400 }
      )
    }

    // Check max entries
    if (form.maxEntries && form._count.submissions >= form.maxEntries) {
      return NextResponse.json(
        { error: 'Form has reached maximum entries' },
        { status: 400 }
      )
    }

    // Create the submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId,
        memberId: submitter.memberId || null,
        name: submitter.name,
        email: submitter.email || null,
        phone: submitter.phone || null,
        responses: responses,
        submittedAt: submittedAt ? new Date(submittedAt) : new Date()
      }
    })

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Submission received successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to process submission' },
      { status: 500 }
    )
  }
}

// GET /api/forms/submissions/webhook - Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'TCN_COMM Form Submissions Webhook',
    timestamp: new Date().toISOString()
  })
}
