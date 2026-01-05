import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch all stats in parallel
    const [
      totalUsers,
      usersByRole,
      usersByDepartment,
      totalEmails,
      emailsLast30Days,
      totalSms,
      smsLast30Days,
      totalBulletins,
      bulletinsLast30Days,
      totalForms,
      totalSubmissions,
      recentLogins,
      dailyEmailStats,
      dailySmsStats,
      dailyLoginStats,
    ] = await Promise.all([
      // User counts
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.user.groupBy({
        by: ['department'],
        _count: { department: true },
      }),
      
      // Email stats
      prisma.emailLog.count(),
      prisma.emailLog.count({
        where: { created: { gte: thirtyDaysAgo } },
      }),
      
      // SMS stats
      prisma.smsLog.count(),
      prisma.smsLog.count({
        where: { created: { gte: thirtyDaysAgo } },
      }),
      
      // Bulletin stats
      prisma.bulletinApiLog.count(),
      prisma.bulletinApiLog.count({
        where: { created: { gte: thirtyDaysAgo } },
      }),
      
      // Form stats
      prisma.signUpForm.count(),
      prisma.formSubmission.count(),
      
      // Recent logins (last 7 days)
      prisma.loginLog.count({
        where: { 
          loginTime: { gte: sevenDaysAgo },
          success: true,
        },
      }),
      
      // Daily email stats for last 30 days
      prisma.$queryRaw`
        SELECT DATE(created) as date, COUNT(*)::int as count
        FROM msgmanager."EmailLog"
        WHERE created >= ${thirtyDaysAgo}
        GROUP BY DATE(created)
        ORDER BY date ASC
      `,
      
      // Daily SMS stats for last 30 days
      prisma.$queryRaw`
        SELECT DATE(created) as date, COUNT(*)::int as count
        FROM msgmanager."SmsLog"
        WHERE created >= ${thirtyDaysAgo}
        GROUP BY DATE(created)
        ORDER BY date ASC
      `,
      
      // Daily login stats for last 30 days
      prisma.$queryRaw`
        SELECT DATE("loginTime") as date, COUNT(*)::int as count
        FROM msgmanager."LoginLog"
        WHERE "loginTime" >= ${thirtyDaysAgo} AND success = true
        GROUP BY DATE("loginTime")
        ORDER BY date ASC
      `,
    ]);

    // Format daily stats for charts
    const formatDailyStats = (data: any[]) => {
      const result: { date: string; count: number }[] = [];
      const dateMap = new Map(data.map(d => [d.date.toISOString().split('T')[0], d.count]));
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
          date: dateStr,
          count: dateMap.get(dateStr) || 0,
        });
      }
      return result;
    };

    // Get recent activity
    const recentEmails = await prisma.emailLog.findMany({
      take: 5,
      orderBy: { created: 'desc' },
      select: {
        id: true,
        subject: true,
        created: true,
        status: true,
        recipients: true,
        user: {
          select: { first_name: true, last_name: true },
        },
      },
    });

    const recentSms = await prisma.smsLog.findMany({
      take: 5,
      orderBy: { created: 'desc' },
      select: {
        id: true,
        message: true,
        created: true,
        status: true,
        recipients: true,
        user: {
          select: { first_name: true, last_name: true },
        },
      },
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        totalEmails,
        emailsLast30Days,
        totalSms,
        smsLast30Days,
        totalBulletins,
        bulletinsLast30Days,
        totalForms,
        totalSubmissions,
        recentLogins,
      },
      usersByRole: usersByRole.map(r => ({
        role: r.role,
        count: r._count.role,
      })),
      usersByDepartment: usersByDepartment.map(d => ({
        department: d.department,
        count: d._count.department,
      })),
      charts: {
        emails: formatDailyStats(dailyEmailStats as any[]),
        sms: formatDailyStats(dailySmsStats as any[]),
        logins: formatDailyStats(dailyLoginStats as any[]),
      },
      recentActivity: {
        emails: recentEmails,
        sms: recentSms,
      },
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
