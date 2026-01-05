import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import prisma from '@/lib/prisma'

// GET /api/forms/[id]/submissions - Get all submissions for a form
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify form exists
    const form = await prisma.signUpForm.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Get submissions
    const submissions = await prisma.formSubmission.findMany({
      where: { formId: id },
      orderBy: { submittedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      form: {
        id: form.id,
        title: form.title,
        fields: form.fields
      },
      submissions,
      totalCount: submissions.length
    })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// DELETE /api/forms/[id]/submissions - Delete a specific submission
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId query parameter is required' },
        { status: 400 }
      )
    }

    await prisma.formSubmission.delete({
      where: { id: submissionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Submission deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting submission:', error)
    return NextResponse.json(
      { error: 'Failed to delete submission' },
      { status: 500 }
    )
  }
}
