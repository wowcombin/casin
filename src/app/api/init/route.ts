import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST() {
  try {
    // Создаем тестового админа
    const admin = await prisma.user.upsert({
      where: { email: 'admin@cazinoureview.ro' },
      update: {},
      create: {
        email: 'admin@cazinoureview.ro',
        name: 'Administrator',
        role: 'ADMIN',
        salary: 5000,
        status: 'ACTIVE'
      }
    })

    // Создаем несколько тестовых казино
    const casino1 = await prisma.casino.upsert({
      where: { id: 'casino-1' },
      update: {},
      create: {
        id: 'casino-1',
        name: 'Casino Royal',
        rating: 4.5,
        bonus: '100% până la 1000 RON',
        description: 'Cel mai popular cazinou online din România',
        referralUrl: 'https://example.com/royal',
        authorId: admin.id
      }
    })

    const casino2 = await prisma.casino.upsert({
      where: { id: 'casino-2' },
      update: {},
      create: {
        id: 'casino-2',
        name: 'Lucky Spin',
        rating: 4.2,
        bonus: '50 Rotiri Gratuite',
        description: 'Cazinou cu cele mai multe jocuri slot',
        referralUrl: 'https://example.com/lucky',
        authorId: admin.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      data: { admin, casino1, casino2 }
    })

  } catch (error) {
    console.error('Database initialization error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initialize database' },
      { status: 500 }
    )
  }
}
