import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Upload poster to portal
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const sourceId = formData.get('sourceId') as string

    if (!file || !sourceId) {
      return NextResponse.json(
        { success: false, error: 'Missing file or sourceId' },
        { status: 400 }
      )
    }

    const portalApiKey = process.env.PORTAL_API_KEY
    const portalApiUrl = process.env.PORTAL_API_URL

    console.log('Portal API Config:', {
      hasApiKey: !!portalApiKey,
      apiKeyLength: portalApiKey?.length,
      portalApiUrl,
      fullUrl: `${portalApiUrl}/poster`,
    })

    if (!portalApiKey || !portalApiUrl) {
      return NextResponse.json(
        { success: false, error: 'Portal API not configured' },
        { status: 500 }
      )
    }

    // Forward to portal API
    const portalFormData = new FormData()
    portalFormData.append('file', file)
    portalFormData.append('sourceId', sourceId)
    portalFormData.append('filename', file.name)

    console.log('Sending to portal:', {
      url: `${portalApiUrl}/poster`,
      sourceId,
      filename: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    const response = await fetch(`${portalApiUrl}/poster`, {
      method: 'POST',
      headers: {
        'x-api-key': portalApiKey,
      },
      body: portalFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Portal API error response:', {
        status: response.status,
        statusText: response.statusText,
        error,
        url: `${portalApiUrl}/poster`,
      })
      throw new Error(`Portal API error (${response.status}): ${error}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error uploading poster:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to upload poster' },
      { status: 500 }
    )
  }
}
