import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        workData: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Last 5 records
        },
        profits: {
          orderBy: { createdAt: 'desc' },
          take: 3 // Last 3 months
        },
        testResults: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { nickname: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: employees
    })

  } catch (error) {
    console.error('Error fetching employees:', error)
    
    // Demo data if DB not available
    const demoEmployees = [
      {
        id: '1',
        nickname: '@opporenno',
        role: 'JUNIOR',
        isActive: true,
        profits: [{ month: 'December', totalProfit: 850.50 }],
        workData: [{ casino: 'Royal Casino', deposit: 1000, withdrawal: 1200 }]
      },
      {
        id: '2', 
        nickname: '@sobroffice',
        role: 'TESTER',
        isActive: true,
        profits: [{ month: 'December', totalProfit: 1250.75 }],
        testResults: [{ casino: 'Lucky Spin', deposit: 500, withdrawal: 750 }]
      }
    ]

    return NextResponse.json({
      success: true,
      data: demoEmployees,
      fallback: true
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nickname, email, role, folderId } = await request.json()

    if (!nickname) {
      return NextResponse.json(
        { success: false, error: 'Nickname is required' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        nickname: nickname.trim(),
        email: email?.trim() || null,
        role: role || 'JUNIOR',
        folderId: folderId?.trim() || null
      }
    })

    return NextResponse.json({
      success: true,
      data: employee
    })

  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { success: false, error: 'Error creating employee' },
      { status: 500 }
    )
  }
}
