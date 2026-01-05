import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Get userId from the session
    const session = await getServerSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const logs = await prisma.bulletinApiLog.findMany({
      where: {
        userId: session.user.id // Filter by current user
      },
      select: {
        id: true,
        created: true,
        category: true,
        title: true,
        subject: true,
        poster_url: true
      },
      orderBy: {
        created: "desc",
      },
      take: 100,
    });

    return NextResponse.json(logs || []);
  } catch (error) {
    console.error("Failed to fetch Web API logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
