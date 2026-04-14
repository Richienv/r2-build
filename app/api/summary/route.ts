import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET() {
  try {
    const [projects, pendingTaskCount, pendingFocusCount] = await Promise.all([
      prisma.project.findMany({ where: { status: { not: 'DONE' } } }),
      prisma.task.count({ where: { completed: false } }),
      prisma.dailyFocus.count({ where: { completed: false } }),
    ])
    const pendingTasks = pendingTaskCount + pendingFocusCount

    const summary = {
      metric: projects.length.toString(),
      unit: 'PROJECTS',
      label: `${pendingTasks} tasks pending`,
      alert: false,
      alertMessage: '',
      urgency: 'info',
    }

    return NextResponse.json(summary, { headers: corsHeaders })
  } catch {
    return NextResponse.json(
      {
        metric: '—',
        unit: '',
        label: 'unavailable',
        alert: false,
        alertMessage: '',
        urgency: 'info',
      },
      { headers: corsHeaders }
    )
  }
}
