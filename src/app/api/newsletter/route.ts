import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }

    const newsletter = await prisma.newsletter.create({
      data: {
        email: email.toLowerCase().trim()
      }
    })

    return NextResponse.json({
      success: true,
      data: newsletter
    })
  } catch (error: any) {
    console.error('Error subscribing to newsletter:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
