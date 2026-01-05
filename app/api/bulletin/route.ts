import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'

// Create bulletin
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
    const { title, subject, category, userId } = body

    if (!title || !subject || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create bulletin in local database
    const bulletin = await prisma.bulletinApiLog.create({
      data: {
        title,
        subject,
        poster_url: '', // Will be updated after poster upload
        category,
        userId: userId || session.user.id,
      },
    })

    return NextResponse.json({
      success: true,
      data: bulletin,
    })
  } catch (error) {
    console.error('Error creating bulletin:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create bulletin' },
      { status: 500 }
    )
  }
}

// Get bulletins
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (category) {
      where.category = category
    }

    const bulletins = await prisma.bulletinApiLog.findMany({
      where,
      take: limit,
      orderBy: { created: 'desc' },
      include: {
        User: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: bulletins,
    })
  } catch (error) {
    console.error('Error fetching bulletins:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bulletins' },
      { status: 500 }
    )
  }
}
