import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { todayCST } from '@/lib/date'

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
    const today = todayCST()
    const focuses = await prisma.dailyFocus.findMany({
      where: { date: today },
    })

    const total = focuses.length
    const done = focuses.filter((f) => f.completed).length

    const summary = {
      metric: `${done}/${total}`,
      unit: 'TASKS',
      label: done === total && total > 0 ? 'all done! 🔥' : 'done today',
      alert: total > 0 && done === 0,
      alertMessage: total === 0 ? 'no tasks set yet' : '',
      urgency: total > 0 && done === 0 ? 'warning' : 'info',
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
