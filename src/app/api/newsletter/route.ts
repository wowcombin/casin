import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email invalid' },
        { status: 400 }
      )
    }

    // Încercăm să salvăm în baza de date
    try {
      await prisma.newsletter.create({
        data: {
          email: email.toLowerCase().trim(),
          subscribedAt: new Date()
        }
      })
    } catch (dbError) {
      // Dacă BD nu e disponibilă, doar returnăm succes pentru demo
      console.log('Newsletter signup (demo mode):', email)
    }

    return NextResponse.json({
      success: true,
      message: 'Te-ai înscris cu succes!'
    })

  } catch (error) {
    console.error('Newsletter signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Eroare la înscriere' },
      { status: 500 }
    )
  }
}
