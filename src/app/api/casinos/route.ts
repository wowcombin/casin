import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  try {
    const casinos = await prisma.casino.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: casinos
    })
  } catch (error: any) {
    console.error('Error fetching casinos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, rating, bonus } = await request.json()

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const casino = await prisma.casino.create({
      data: {
        name: name.trim(),
        rating: rating ? parseFloat(rating) : null,
        bonus: bonus?.trim() || null
      }
    })

    return NextResponse.json({
      success: true,
      data: casino
    })
  } catch (error: any) {
    console.error('Error creating casino:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
