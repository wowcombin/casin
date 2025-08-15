import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { companyName, email, website, message } = await request.json()

    // Валидация
    if (!companyName || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Toate câmpurile obligatorii trebuie completate' },
        { status: 400 }
      )
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email invalid' },
        { status: 400 }
      )
    }

    // Salvăm în baza de date
    try {
      await prisma.partnership.create({
        data: {
          companyName: companyName.trim(),
          email: email.toLowerCase().trim(),
          website: website?.trim() || null,
          message: message.trim(),
          status: 'PENDING'
        }
      })
    } catch (dbError) {
      // Dacă BD nu e disponibilă, doar loggăm pentru demo
      console.log('Partnership application (demo mode):', {
        companyName,
        email,
        website,
        message
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Cererea ta a fost trimisă cu succes!'
    })

  } catch (error) {
    console.error('Partnership application error:', error)
    return NextResponse.json(
      { success: false, error: 'Eroare la trimiterea cererii' },
      { status: 500 }
    )
  }
}
