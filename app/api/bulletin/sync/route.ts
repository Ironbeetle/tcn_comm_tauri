import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'

// Sync bulletin to portal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { sourceId, title, subject, poster_url, category, userId } = body

    if (!sourceId || !title || !subject || !poster_url || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const portalApiKey = process.env.PORTAL_API_KEY
    const portalApiUrl = process.env.PORTAL_API_URL

    if (!portalApiKey || !portalApiUrl) {
      return NextResponse.json(
        { success: false, error: 'Portal API not configured' },
        { status: 500 }
      )
    }

    // Portal expects relative path for poster_url (e.g., /bulletinboard/xxx.jpg)
    // NOT a full URL - the portal stores it as a relative path
    const portalPosterUrl = poster_url.startsWith('http') 
      ? poster_url.replace(/https?:\/\/[^\/]+/, '')
      : poster_url

    // For local storage, we want the full URL
    const portalBaseUrl = process.env.PORTAL_API_URL?.replace('/api/sync', '') || 'https://tcnaux.ca'
    const fullPosterUrl = poster_url.startsWith('http') 
      ? poster_url 
      : `${portalBaseUrl}${poster_url}`

    // Sync to portal - using snake_case field names as portal expects
    // Note: We don't send userId since that's a local user ID that doesn't exist on the portal
    const bulletinPayload = {
      sourceId,
      title,
      subject,
      poster_url: portalPosterUrl,  // Portal expects relative path
      category,
      created: new Date().toISOString(),
    }
    
    console.log('Syncing bulletin to portal:', {
      url: `${portalApiUrl}/bulletin`,
      payload: bulletinPayload,
      rawPosterUrl: poster_url,
    })

    const response = await fetch(`${portalApiUrl}/bulletin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': portalApiKey,  // Must be lowercase per portal API spec
      },
      body: JSON.stringify(bulletinPayload),
    })

    // Always update local database with the poster URL
    await prisma.bulletinApiLog.update({
      where: { id: sourceId },
      data: { poster_url: fullPosterUrl },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Portal bulletin sync failed:', {
        status: response.status,
        statusText: response.statusText,
        error,
        payloadSent: bulletinPayload,
      })
      // Return partial success - local save worked, portal sync failed
      return NextResponse.json({
        success: true,
        portalSynced: false,
        portalError: error,
        message: 'Bulletin saved locally but portal sync failed',
        data: { sourceId, poster_url: fullPosterUrl }
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      portalSynced: true,
      data
    })
  } catch (error) {
    console.error('Error syncing bulletin:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to sync bulletin' },
      { status: 500 }
    )
  }
}
