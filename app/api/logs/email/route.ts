import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Get userId from the session
    const session = await prisma.session.findFirst({
      where: {
        expires: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.emailLog.findMany({
      where: {
        userId: session.user.id // Filter by current user
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
          }
        }
      },
      orderBy: {
        created: "desc",
      },
      take: 100,
    });

    // For each log, format the recipients for display
    const logsWithRecipients = logs.map((log) => {
      return {
        ...log,
        recipientDetails: log.recipients.map(email => ({
          email,
          display_name: email // Use email as display name since we don't have member lookup
        }))
      };
    });

    return NextResponse.json(logsWithRecipients);
  } catch (error) {
    console.error("Failed to fetch email logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
