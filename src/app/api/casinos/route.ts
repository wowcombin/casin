import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET() {
  try {
    const casinos = await prisma.casino.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: casinos
    })

  } catch (error) {
    console.error('Error fetching casinos:', error)
    
    // Возвращаем демо данные если БД недоступна
    const demoCasinos = [
      {
        id: 'demo-1',
        name: 'Casino Royal',
        rating: 4.5,
        bonus: '100% până la 1000 RON + 100 Rotiri Gratuite',
        description: 'Cel mai popular cazinou online din România cu peste 2000 de jocuri',
        referralUrl: 'https://example.com/royal'
      },
      {
        id: 'demo-2', 
        name: 'Lucky Spin',
        rating: 4.2,
        bonus: '50 Rotiri Gratuite fără depunere',
        description: 'Cazinou cu cele mai multe jocuri slot și jackpot-uri progresive',
        referralUrl: 'https://example.com/lucky'
      },
      {
        id: 'demo-3',
        name: 'Bet Champion',
        rating: 4.7,
        bonus: '200% bonus până la 2000 RON',
        description: 'Cazinou premium cu suport 24/7 și retrageri rapide',
        referralUrl: 'https://example.com/champion'
      }
    ]

    return NextResponse.json({
      success: true,
      data: demoCasinos,
      fallback: true
    })
  }
}
