import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import prisma from '@/lib/prisma'
import { syncFormToPortal, deleteFormFromPortal } from '@/lib/portal-sync'

// GET /api/forms/[id] - Get a single form with fields
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

    const form = await prisma.signUpForm.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { submissions: true }
        }
      }
    })

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      form: {
        ...form,
        submissionCount: form._count.submissions
      }
    })
  } catch (error) {
    console.error('Error fetching form:', error)
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    )
  }
}

// PATCH /api/forms/[id] - Update a form
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, deadline, maxEntries, isActive, category, fields } = body

    // Check if form exists
    const existingForm = await prisma.signUpForm.findUnique({
      where: { id },
      include: { fields: true }
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Update form data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null
    if (maxEntries !== undefined) updateData.maxEntries = maxEntries ? parseInt(maxEntries) : null
    if (isActive !== undefined) updateData.isActive = isActive

    // If fields are provided, replace all fields
    if (fields && Array.isArray(fields)) {
      // Delete existing fields
      await prisma.formField.deleteMany({
        where: { formId: id }
      })

      // Create new fields
      await prisma.formField.createMany({
        data: fields.map((field: any, index: number) => ({
          formId: id,
          label: field.label,
          fieldType: field.fieldType,
          options: field.options ? JSON.stringify(field.options) : null,
          placeholder: field.placeholder || null,
          required: field.required || false,
          order: field.order ?? index
        }))
      })
    }

    // Update the form
    const form = await prisma.signUpForm.update({
      where: { id },
      data: updateData,
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // Sync to portal
    const syncResult = await syncFormToPortal(form, category, session.user.department)

    return NextResponse.json({
      success: true,
      form,
      portalSynced: syncResult.success,
      portalError: syncResult.error
    })

  } catch (error) {
    console.error('Error updating form:', error)
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    )
  }
}

// DELETE /api/forms/[id] - Delete a form
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if form exists
    const existingForm = await prisma.signUpForm.findUnique({
      where: { id }
    })

    if (!existingForm) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Delete from portal first
    const portalResult = await deleteFormFromPortal(id)

    // Delete from local database (cascades to fields and submissions)
    await prisma.signUpForm.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Form deleted successfully',
      portalSynced: portalResult.success
    })

  } catch (error) {
    console.error('Error deleting form:', error)
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    )
  }
}
