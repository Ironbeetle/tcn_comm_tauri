import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import prisma from '@/lib/prisma'
import { createSmsLog } from '@/lib/actions'

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !twilioPhoneNumber) {
  console.error('Missing Twilio configuration in environment variables')
}

const client = twilio(accountSid, authToken)

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('SMS API: No session or user ID found')
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { message, recipients } = body

    // Validate input
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient is required' },
        { status: 400 }
      )
    }

    // Validate phone numbers (basic validation)
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    const invalidNumbers = recipients.filter(phone => !phoneRegex.test(phone))
    
    if (invalidNumbers.length > 0) {
      return NextResponse.json(
        { error: `Invalid phone numbers: ${invalidNumbers.join(', ')}` },
        { status: 400 }
      )
    }

    // Send SMS messages
    const messagePromises = recipients.map(async (phoneNumber: string) => {
      try {
        // Clean phone number (remove spaces, dashes, parentheses)
        const cleanedNumber = phoneNumber.replace(/[\s\-\(\)]/g, '')
        
        // Ensure number starts with + for international format
        const formattedNumber = cleanedNumber.startsWith('+') 
          ? cleanedNumber 
          : `+1${cleanedNumber}` // Assuming North American numbers
        
        const twilioMessage = await client.messages.create({
          body: message,
          from: twilioPhoneNumber,
          to: formattedNumber,
        })

        return {
          phoneNumber: formattedNumber,
          messageId: twilioMessage.sid,
          status: twilioMessage.status,
          success: true,
        }
      } catch (error: any) {
        console.error(`Failed to send SMS to ${phoneNumber}:`, error)
        return {
          phoneNumber,
          messageId: null,
          status: 'failed',
          error: error.message,
          success: false,
        }
      }
    })

    const results = await Promise.allSettled(messagePromises)
    
    // Process results
    const successfulMessages: any[] = []
    const failedMessages: any[] = []
    const messageIds: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successfulMessages.push(result.value)
          if (result.value.messageId) {
            messageIds.push(result.value.messageId)
          }
        } else {
          failedMessages.push(result.value)
        }
      } else {
        failedMessages.push({
          phoneNumber: recipients[index],
          error: result.reason?.message || 'Unknown error',
          success: false,
        })
      }
    })

    // Determine overall status
    const overallStatus = failedMessages.length === 0 ? 'sent' : 
                         successfulMessages.length === 0 ? 'failed' : 'partial'

    // Log to database
    try {
      await createSmsLog({
        message,
        recipients,
        status: overallStatus,
        messageIds,
        error: failedMessages.length > 0 ? 
          `Failed: ${failedMessages.map(f => `${f.phoneNumber}: ${f.error}`).join('; ')}` : 
          undefined,
        userId: session.user.id,
      })
    } catch (dbError) {
      console.error('Failed to log SMS to database:', dbError)
      // Don't fail the API call if logging fails
    }

    // Return response
    return NextResponse.json({
      success: overallStatus !== 'failed',
      message: `SMS sent to ${successfulMessages.length} of ${recipients.length} recipients`,
      results: {
        successful: successfulMessages.length,
        failed: failedMessages.length,
        total: recipients.length,
        messageIds,
        failures: failedMessages,
      },
    })

  } catch (error: any) {
    console.error('SMS API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve SMS logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [smsLogs, total] = await Promise.all([
      prisma.smsLog.findMany({
        where: { userId: session.user.id },
        orderBy: { created: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
      }),
      prisma.smsLog.count({
        where: { userId: session.user.id },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        smsLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })

  } catch (error: any) {
    console.error('SMS logs fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}