import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const stats = await prisma.platformStats.findUnique({
      where: { id: 'singleton' },
    })

    return NextResponse.json({
      campaignsMonitored: stats?.campaignsMonitored ?? 0,
      spendProtected: stats?.spendProtected ?? 0,
      creativeRefreshes: stats?.creativeRefreshes ?? 0,
      totalAnalysesCompleted: stats?.totalAnalysesCompleted ?? 0,
    })
  } catch {
    // If the table doesn't exist yet (pre-migration), return zeros
    return NextResponse.json({
      campaignsMonitored: 0,
      spendProtected: 0,
      creativeRefreshes: 0,
      totalAnalysesCompleted: 0,
    })
  }
}
