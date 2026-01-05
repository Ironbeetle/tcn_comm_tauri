import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import twilio from '@/lib/twilio';
import resend from '@/lib/resend';
import { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    // Get the current user session
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('Message being created for user:', userId);

    // Check if it's a Web API message
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await request.json();

      // Create Web API message
      const webMessage = await prisma.msgCnC.create({
        data: {
          title: body.title,
          content: body.content,
          priority: body.priority,
          type: body.type || 'notice',
          date: new Date(body.date),
          time: new Date(body.time),
          expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
          isPublished: body.isPublished || false,
          userId: userId, // Using the correct userId from session
          location: body.location || 'Location' // Provide a default or required value for location
        }
      });

      console.log('Web API Message Created:', {
        messageId: webMessage.id,
        userId: userId,
        timestamp: new Date().toISOString()
      });

      return NextResponse.json({
        success: true,
        message: webMessage
      });
    } else {
      // Handle existing SMS and Email functionality
      const formData = await request.formData();
      const type = formData.get('type') as string;

      if (type === 'sms') {
        const message = formData.get('message') as string;
        const recipients = JSON.parse(formData.get('recipients') as string);
        const smsPromises = recipients.map(async (recipient: any) => {
          try {
            const result = await twilio.messages.create({
              body: message,
              to: recipient.contact_number,
              from: process.env.TWILIO_PHONE_NUMBER
            });

            return {
              success: true,
              messageId: result.sid,
              recipient: recipient.contact_number
            };
          } catch (error: any) {
            console.error('SMS sending error:', error);
            return {
              success: false,
              error: error.message,
              recipient: recipient.contact_number
            };
          }
        });

        const results = await Promise.all(smsPromises);

        // Log the SMS sending attempt using the correct userId
        await prisma.smsLog.create({
          data: {
            message,
            recipients: recipients.map((r: any) => r.contact_number),
            status: results.every(r => r.success) ? 'success' : 'partial',
            messageIds: results.filter(r => r.success).map(r => r.messageId),
            error: results.filter(r => !r.success).map(r => r.error).join(', ') || null,
            userId: userId // Using the correct userId from session
          }
        });

        return NextResponse.json({
          success: true,
          results
        });
      } else if (type === 'email') {
        const subject = formData.get('subject') as string;
        const message = formData.get('message') as string;
        const attachments = formData.getAll('attachments') as File[];
        const recipients = JSON.parse(formData.get('recipients') as string);

        const emailPromises = recipients.map(async (recipient: any) => {
          try {
            const attachmentPromises = attachments.map(async (file) => ({
              filename: file.name,
              content: await file.arrayBuffer()
            }));

            const attachmentData = await Promise.all(attachmentPromises);

            const result = await resend.emails.send({
              from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL}>`,
              to: recipient.email,
              subject: subject,
              html: message,
              attachments: attachmentData.map(att => ({
                filename: att.filename,
                content: Buffer.from(att.content)
              }))
            });

            return {
              success: true,
              messageId: result.data?.id,
              recipient: recipient.email
            };
          } catch (error: any) {
            console.error('Email sending error:', error);
            return {
              success: false,
              error: error.message,
              recipient: recipient.email
            };
          }
        });

        const results = await Promise.all(emailPromises);

        // Log the email sending attempt using the correct userId
        await prisma.emailLog.create({
          data: {
            subject,
            message,
            recipients: recipients.map((r: any) => r.email),
            status: results.every(r => r.success) ? 'success' : 'partial',
            messageId: results.find(r => r.success)?.messageId,
            error: results.filter(r => !r.success).map(r => r.error).join(', ') || null,
            attachments: attachments.length > 0 
              ? { files: attachments.map(f => f.name) }
              : undefined,
            userId: userId // Using the correct userId from session
          }
        });

        return NextResponse.json({
          success: true,
          results
        });
      }
    }

    return NextResponse.json({ error: "Invalid request type" }, { status: 400 });
  } catch (error) {
    console.error('Message sending error:', error);
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
  }
}

// Add GET method to fetch messages
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'web';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const messages = await prisma.msgCnC.findMany({
      where: {
        type,
        isPublished: true,
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      orderBy: {
        created: 'desc'
      },
      take: limit
    });

    console.log(`Fetched ${messages.length} messages of type: ${type}`);

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
