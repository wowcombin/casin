import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: Request) {
  try {
    const { companyName, email, message } = await request.json()

    if (!companyName || !email) {
      return NextResponse.json(
        { success: false, error: 'Company name and email are required' },
        { status: 400 }
      )
    }

    const partnership = await prisma.partnership.create({
      data: {
        companyName: companyName.trim(),
        email: email.toLowerCase().trim(),
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      data: partnership
    })
  } catch (error: any) {
    console.error('Error creating partnership:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
