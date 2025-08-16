import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        workData: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Last 5 records
        },
        testResults: {
          orderBy: { createdAt: 'desc' },
          take: 3 // Last 3 records
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: employees
    })
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { nickname, role } = await request.json()

    if (!nickname) {
      return NextResponse.json(
        { success: false, error: 'Nickname is required' },
        { status: 400 }
      )
    }

    // Check if employee already exists
    const existingEmployee = await prisma.employee.findUnique({
      where: { nickname: nickname.trim() }
    })

    if (existingEmployee) {
      return NextResponse.json(
        { success: false, error: 'Employee with this nickname already exists' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.create({
      data: {
        nickname: nickname.trim(),
        role: role?.trim() || 'JUNIOR',
        isActive: true
      }
    })

    return NextResponse.json({
      success: true,
      data: employee
    })
  } catch (error: any) {
    console.error('Error creating employee:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, nickname, role, isActive } = await request.json()

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: {
        ...(nickname && { nickname: nickname.trim() }),
        ...(role && { role: role.trim() }),
        ...(typeof isActive === 'boolean' && { isActive })
      }
    })

    return NextResponse.json({
      success: true,
      data: employee
    })
  } catch (error: any) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      )
    }

    // Check if employee has work data
    const workDataCount = await prisma.workData.count({
      where: { employeeId: parseInt(id) }
    })

    if (workDataCount > 0) {
      // Just deactivate instead of delete
      const employee = await prisma.employee.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      })

      return NextResponse.json({
        success: true,
        message: 'Employee deactivated (has work data)',
        data: employee
      })
    }

    // Delete if no work data
    await prisma.employee.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({
      success: true,
      message: 'Employee deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting employee:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
