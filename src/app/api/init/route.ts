import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function POST() {
  try {
    // Создаем тестовые казино если их нет
    const casinoCount = await prisma.casino.count()
    
    if (casinoCount === 0) {
      await prisma.casino.createMany({
        data: [
          {
            name: 'Casino Royal',
            rating: 4.5,
            bonus: '100% până la 1000 RON'
          },
          {
            name: 'Lucky Games',
            rating: 4.2,
            bonus: '200% până la 500 RON'
          },
          {
            name: 'Vegas Palace',
            rating: 4.8,
            bonus: '50 Free Spins'
          }
        ]
      })
    }

    // Создаем тестовые partnerships если их нет
    const partnershipCount = await prisma.partnership.count()
    
    if (partnershipCount === 0) {
      await prisma.partnership.createMany({
        data: [
          {
            companyName: 'Royal Casino SRL',
            email: 'contact@royal.com',
            status: 'PENDING'
          },
          {
            companyName: 'Lucky Games Ltd',
            email: 'info@lucky.com',
            status: 'APPROVED'
          }
        ]
      })
    }

    // Создаем тестовые job applications если их нет
    const jobCount = await prisma.jobApplication.count()
    
    if (jobCount === 0) {
      await prisma.jobApplication.createMany({
        data: [
          {
            name: 'Ion Popescu',
            email: 'ion@example.com',
            position: 'Content Writer',
            status: 'PENDING'
          },
          {
            name: 'Maria Ionescu',
            email: 'maria@example.com',
            position: 'SEO Specialist',
            status: 'REVIEWING'
          }
        ]
      })
    }

    // Создаем newsletter subscribers если их нет
    const newsletterCount = await prisma.newsletter.count()
    
    if (newsletterCount === 0) {
      await prisma.newsletter.createMany({
        data: [
          { email: 'user1@example.com' },
          { email: 'user2@example.com' },
          { email: 'user3@example.com' }
        ],
        skipDuplicates: true
      })
    }

    // Создаем тестовых сотрудников если их нет
    const employeeCount = await prisma.employee.count()
    
    if (employeeCount === 0) {
      await prisma.employee.createMany({
        data: [
          {
            nickname: '@opporenno',
            role: 'JUNIOR',
            isActive: true
          },
          {
            nickname: '@sobroffice',
            role: 'TESTER',
            isActive: true
          }
        ]
      })
    }

    // Создаем месячную отчетность если ее нет
    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    await prisma.monthlyAccounting.upsert({
      where: { month: currentMonth },
      update: {},
      create: {
        month: currentMonth,
        gbpUsdRate: 1.27
      }
    })

    const stats = {
      casinos: await prisma.casino.count(),
      partnerships: await prisma.partnership.count(),
      jobApplications: await prisma.jobApplication.count(),
      newsletters: await prisma.newsletter.count(),
      employees: await prisma.employee.count()
    }

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      data: stats
    })

  } catch (error: any) {
    console.error('Error initializing database:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const stats = {
      casinos: await prisma.casino.count(),
      partnerships: await prisma.partnership.count(),
      jobApplications: await prisma.jobApplication.count(),
      newsletters: await prisma.newsletter.count(),
      employees: await prisma.employee.count(),
      workData: await prisma.workData.count(),
      testResults: await prisma.testResult.count()
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error: any) {
    console.error('Error getting stats:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
