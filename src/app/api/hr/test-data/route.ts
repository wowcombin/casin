import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: Request) {
  try {
    const { employeeNickname, month, casino, deposit, withdrawal, card } = await request.json()

    if (!employeeNickname || !month || !casino) {
      return NextResponse.json(
        { success: false, error: 'Employee nickname, month, and casino are required' },
        { status: 400 }
      )
    }

    // Find or create employee
    let employee = await prisma.employee.findUnique({
      where: { nickname: employeeNickname.trim() }
    })

    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          nickname: employeeNickname.trim(),
          role: 'TESTER',
          isActive: true
        }
      })
    }

    // Create test result record
    const testResult = await prisma.testResult.create({
      data: {
        employeeId: employee.id,
        month: month.trim(),
        casino: casino.trim(),
        deposit: deposit || 0,
        withdrawal: withdrawal || 0,
        card: card?.trim() || 'N/A'
      },
      include: {
        employee: true
      }
    })

    return NextResponse.json({
      success: true,
      data: testResult,
      message: `Test data added for ${employee.nickname}`
    })

  } catch (error: any) {
    console.error('Error creating test data:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const employeeId = searchParams.get('employeeId')

    const where: any = {}
    if (month) where.month = month
    if (employeeId) where.employeeId = parseInt(employeeId)

    const testData = await prisma.testResult.findMany({
      where,
      include: {
        employee: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: testData
    })

  } catch (error: any) {
    console.error('Error fetching test data:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
