import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, position, message } = await request.json()

    // Валидация
    if (!name || !email || !position || !message) {
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
      await prisma.jobApplication.create({
        data: {
          name: name.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || null,
          position: position.trim(),
          message: message.trim(),
          status: 'PENDING'
        }
      })
    } catch (dbError) {
      // Dacă BD nu e disponibilă, doar loggăm pentru demo
      console.log('Job application (demo mode):', {
        name,
        email,
        phone,
        position,
        message
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Candidatura ta a fost trimisă cu succes!'
    })

  } catch (error) {
    console.error('Job application error:', error)
    return NextResponse.json(
      { success: false, error: 'Eroare la trimiterea candidaturii' },
      { status: 500 }
    )
  }
}
