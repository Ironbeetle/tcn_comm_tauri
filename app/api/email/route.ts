import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import prisma from '@/lib/prisma'
import { createEmailLog } from '@/lib/actions'

// Initialize Resend client
const resendApiKey = process.env.RESEND_API_KEY

if (!resendApiKey) {
  console.error('Missing RESEND_API_KEY in environment variables')
}

const resend = new Resend(resendApiKey)

export async function POST(request: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      console.error('Email API: No session or user ID found')
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    
    // Extract form data
    const subject = formData.get('subject') as string
    const message = formData.get('message') as string
    const recipientsJson = formData.get('recipients') as string
    const attachmentFiles = formData.getAll('attachments') as File[]

    // Parse recipients
    let recipients: string[]
    try {
      recipients = JSON.parse(recipientsJson)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid recipients format' },
        { status: 400 }
      )
    }

    // Validate input
    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      )
    }

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

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = recipients.filter(email => !emailRegex.test(email))
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      )
    }

    // Process attachments
    let attachments: any[] = []
    if (attachmentFiles && attachmentFiles.length > 0) {
      // Check file size limit (10MB total)
      const totalSize = attachmentFiles.reduce((sum, file) => sum + file.size, 0)
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      if (totalSize > maxSize) {
        return NextResponse.json(
          { error: 'Total attachment size cannot exceed 10MB' },
          { status: 400 }
        )
      }

      // Convert files to base64 for Resend
      for (const file of attachmentFiles) {
        if (file.size > 0) {
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          
          attachments.push({
            filename: file.name,
            content: buffer,
          })
        }
      }
    }

    // Get sender email from environment (must be verified in Resend)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
    const fromName = process.env.RESEND_FROM_NAME || 'TCN Messenger'

    // Send emails
    const emailPromises = recipients.map(async (email: string) => {
      try {
        const emailData: any = {
          from: `${fromName} <${fromEmail}>`,
          to: [email],
          subject: subject.trim(),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #2563eb; margin: 0;">TCN Band Office</h2>
                <p style="color: #6b7280; margin: 5px 0 0 0;">Message from ${fromName}</p>
              </div>
              
              <div style="background-color: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h3 style="color: #1f2937; margin-top: 0;">${subject}</h3>
                <div style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message.trim()}</div>
              </div>
              
              <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 8px; font-size: 12px; color: #6b7280;">
                <p style="margin: 0;">This message was sent from the TCN Band Office communication system.</p>
                <p style="margin: 5px 0 0 0;">Please do not reply to this email. For inquiries, contact the band office directly.</p>
              </div>
            </div>
          `,
          text: `${subject}\n\nFrom: ${fromName}\n\n${message.trim()}\n\n---\nThis message was sent from the TCN Band Office communication system.`,
        }

        // Add attachments if any
        if (attachments.length > 0) {
          emailData.attachments = attachments
        }

        const result = await resend.emails.send(emailData)

        return {
          email,
          messageId: result.data?.id || null,
          status: 'sent',
          success: true,
        }
      } catch (error: any) {
        console.error(`Failed to send email to ${email}:`, error)
        return {
          email,
          messageId: null,
          status: 'failed',
          error: error.message,
          success: false,
        }
      }
    })

    const results = await Promise.allSettled(emailPromises)
    
    // Process results
    const successfulEmails: any[] = []
    const failedEmails: any[] = []
    const messageIds: string[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          successfulEmails.push(result.value)
          if (result.value.messageId) {
            messageIds.push(result.value.messageId)
          }
        } else {
          failedEmails.push(result.value)
        }
      } else {
        failedEmails.push({
          email: recipients[index],
          error: result.reason?.message || 'Unknown error',
          success: false,
        })
      }
    })

    // Determine overall status
    const overallStatus = failedEmails.length === 0 ? 'sent' : 
                         successfulEmails.length === 0 ? 'failed' : 'partial'

    // Prepare attachments data for database
    const attachmentsData = attachments.length > 0 ? {
      files: attachments.map(att => ({
        filename: att.filename,
        size: att.content.length,
      })),
      total_size: attachments.reduce((sum, att) => sum + att.content.length, 0),
      count: attachments.length,
    } : null

    // Log to database
    try {
      await createEmailLog({
        subject: subject.trim(),
        message: message.trim(),
        recipients,
        status: overallStatus,
        messageId: messageIds.length > 0 ? messageIds[0] : undefined, // Store first message ID
        error: failedEmails.length > 0 ? 
          `Failed: ${failedEmails.map(f => `${f.email}: ${f.error}`).join('; ')}` : 
          undefined,
        attachments: attachmentsData,
        userId: session.user.id,
      })
    } catch (dbError) {
      console.error('Failed to log email to database:', dbError)
      // Don't fail the API call if logging fails
    }

    // Return response
    return NextResponse.json({
      success: overallStatus !== 'failed',
      message: `Email sent to ${successfulEmails.length} of ${recipients.length} recipients`,
      results: {
        successful: successfulEmails.length,
        failed: failedEmails.length,
        total: recipients.length,
        messageIds,
        failures: failedEmails,
      },
    })

  } catch (error: any) {
    console.error('Email API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve email logs
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

    const [emailLogs, total] = await Promise.all([
      prisma.emailLog.findMany({
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
      prisma.emailLog.count({
        where: { userId: session.user.id },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        emailLogs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    })

  } catch (error: any) {
    console.error('Email logs fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}