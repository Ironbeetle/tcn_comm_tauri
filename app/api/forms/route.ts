import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import prisma from '@/lib/prisma'
import { syncFormToPortal, deleteFormFromPortal } from '@/lib/portal-sync'

// GET /api/forms - List all forms (for staff)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const forms = await prisma.signUpForm.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ 
      success: true,
      forms: forms.map(form => ({
        ...form,
        submissionCount: form._count.submissions
      }))
    })
  } catch (error) {
    console.error('Error fetching forms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    )
  }
}

// POST /api/forms - Create a new form
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, deadline, maxEntries, category, fields } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json(
        { error: 'At least one field is required' },
        { status: 400 }
      )
    }

    // Create the form with fields
    const form = await prisma.signUpForm.create({
      data: {
        title,
        description,
        deadline: deadline ? new Date(deadline) : null,
        maxEntries: maxEntries ? parseInt(maxEntries) : null,
        createdBy: session.user.id,
        fields: {
          create: fields.map((field: any, index: number) => ({
            fieldId: field.fieldId || null,  // Semantic ID for auto-fill (e.g., 'full_name', 'email')
            label: field.label,
            fieldType: field.fieldType,
            options: field.options ? JSON.stringify(field.options) : null,
            placeholder: field.placeholder || null,
            required: field.required || false,
            order: field.order ?? index
          }))
        }
      },
      include: {
        fields: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // Sync to portal
    const syncResult = await syncFormToPortal(form, category, session.user.department)
    
    if (!syncResult.success) {
      console.warn('Form created but portal sync failed:', syncResult.error)
    } else if (syncResult.portalFormId) {
      // Store the portal's form ID for later sync operations
      await prisma.signUpForm.update({
        where: { id: form.id },
        data: { 
          portalFormId: syncResult.portalFormId,
          syncedAt: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      form,
      portalSynced: syncResult.success,
      portalFormId: syncResult.portalFormId,
      portalError: syncResult.error
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating form:', error)
    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    )
  }
}
