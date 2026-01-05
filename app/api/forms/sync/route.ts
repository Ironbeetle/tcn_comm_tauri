import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const PORTAL_URL = process.env.TCN_PORTAL_URL || 'https://tcnaux.ca'
const PORTAL_API_KEY = process.env.TCN_PORTAL_API_KEY || ''

// GET /api/forms/sync - Pull submissions from portal
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')
    const since = searchParams.get('since')

    if (!PORTAL_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Portal API key not configured' },
        { status: 500 }
      )
    }

    // If formId provided, verify the form exists locally
    let localForm = null
    
    if (formId) {
      localForm = await prisma.signUpForm.findUnique({
        where: { id: formId }
      })
      
      if (!localForm) {
        return NextResponse.json(
          { success: false, error: 'Form not found locally' },
          { status: 404 }
        )
      }
    }

    // Build query params for portal
    // Portal expects our local form ID (stored as tcn_form_id on portal)
    const params = new URLSearchParams()
    if (formId) params.append('formId', formId)
    if (since) params.append('since', since)

    // Fetch submissions from portal
    const portalUrl = `${PORTAL_URL}/api/signup-forms/submissions?${params.toString()}`
    console.log('Fetching from portal:', portalUrl)
    
    const response = await fetch(portalUrl, {
      method: 'GET',
      headers: {
        'x-api-key': PORTAL_API_KEY,
        'Content-Type': 'application/json'
      }
    })

    console.log('Portal response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log('Portal error response:', errorText)
      throw new Error(`Portal returned ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    if (!data.success || !data.data?.submissions) {
      return NextResponse.json({
        success: true,
        message: 'No new submissions',
        synced: 0
      })
    }

    // Store submissions locally
    let synced = 0
    let skipped = 0

    for (const sub of data.data.submissions) {
      // Map portal formId back to local formId
      // First check if we have a form with this portalFormId
      let targetFormId = formId // Use local formId if we looked it up
      
      if (!targetFormId) {
        // If no formId provided, try to find local form by portalFormId
        const localFormByPortalId = await prisma.signUpForm.findUnique({
          where: { portalFormId: sub.formId }
        })
        
        if (localFormByPortalId) {
          targetFormId = localFormByPortalId.id
        } else {
          // Try direct match (portal might use our local ID)
          const localFormById = await prisma.signUpForm.findUnique({
            where: { id: sub.formId }
          })
          targetFormId = localFormById?.id || null
        }
      }
      
      if (!targetFormId) {
        console.warn(`Form ${sub.formId} not found locally, skipping submission`)
        skipped++
        continue
      }

      // Check if we already have this submission
      const existing = await prisma.formSubmission.findFirst({
        where: {
          formId: targetFormId,
          name: sub.name,
          email: sub.email || null,
          submittedAt: new Date(sub.submittedAt)
        }
      })

      if (existing) {
        skipped++
        continue
      }

      // Create submission
      await prisma.formSubmission.create({
        data: {
          formId: targetFormId,
          memberId: sub.memberId ? parseInt(sub.memberId, 10) : null,
          name: sub.name,
          email: sub.email || null,
          phone: sub.phone || null,
          responses: sub.responses,
          submittedAt: new Date(sub.submittedAt)
        }
      })

      synced++
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} submissions, skipped ${skipped} duplicates`,
      synced,
      skipped,
      total: data.data.submissions.length
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sync submissions' 
      },
      { status: 500 }
    )
  }
}

// POST /api/forms/sync - Trigger sync for specific form
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId } = body

    if (!formId) {
      return NextResponse.json(
        { success: false, error: 'formId is required' },
        { status: 400 }
      )
    }

    // Redirect to GET with formId
    const url = new URL(request.url)
    url.searchParams.set('formId', formId)
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: request.headers
    })

    return response

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync' },
      { status: 500 }
    )
  }
}
