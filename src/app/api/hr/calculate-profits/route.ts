import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { month } = await request.json()
    
    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month is required' },
        { status: 400 }
      )
    }

    // Team configuration (same as your Google Script)
    const team = {
      '@i88jU': 0.05,
      '@n1mbo': 0.10,
      '@sobroffice': 0.10,
      '@zvr1903': 0.05
    }

    // Get or create monthly accounting record
    const monthlyAccounting = await getOrCreateMonthlyAccounting(month)
    const rate = monthlyAccounting.gbpUsdRate

    // Get all work data for the month
    const workData = await prisma.workData.findMany({
      where: { month },
      include: { employee: true }
    })

    // Get test results for @sobroffice
    const testResults = await prisma.testResult.findMany({
      where: { 
        month,
        employee: { nickname: '@sobroffice' }
      }
    })

    // Get spending for the month
    const spending = await prisma.spending.findMany({
      where: { month }
    })

    const totalSpending = spending.reduce((sum, item) => sum + item.amount, 0)

    // Calculate profits
    const juniorProfits = {}
    let totalBase = 0
    let totalProfit = 0

    // Process work data
    for (const work of workData) {
      const base = (work.withdrawal - work.deposit) * rate * 0.97
      const calculation = base * 0.1 // 10% profit
      
      totalBase += base
      totalProfit += calculation

      const nickname = work.employee.nickname
      if (!juniorProfits[nickname]) {
        juniorProfits[nickname] = 0
      }
      juniorProfits[nickname] += calculation
    }

    // Add test results for @sobroffice
    for (const test of testResults) {
      const testCalculation = (test.withdrawal - test.deposit) * rate * 0.97 * 0.1
      if (!juniorProfits['@sobroffice']) {
        juniorProfits['@sobroffice'] = 0
      }
      juniorProfits['@sobroffice'] += testCalculation
    }

    // Apply bonus (if profit > 200, add 200 bonus)
    for (const nickname in juniorProfits) {
      if (juniorProfits[nickname] > 200) {
        juniorProfits[nickname] += 200
      }
    }

    // Calculate team profits
    const isExceedSpending = totalSpending > 0.25 * totalBase
    const baseForTeam = isExceedSpending ? totalBase - totalSpending : totalBase

    const teamProfits = {}
    for (const [member, percent] of Object.entries(team)) {
      teamProfits[member] = percent * baseForTeam
    }

    // Sum team profit for @sobroffice
    if (teamProfits['@sobroffice']) {
      if (!juniorProfits['@sobroffice']) {
        juniorProfits['@sobroffice'] = 0
      }
      juniorProfits['@sobroffice'] += teamProfits['@sobroffice']
    }

    // Save profits to database
    await saveEmployeeProfits(month, juniorProfits, teamProfits)

    // Update monthly accounting
    await prisma.monthlyAccounting.update({
      where: { month },
      data: {
        totalBase,
        totalSpending,
        totalProfit,
        isProcessed: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        month,
        rate,
        totalBase,
        totalSpending,
        totalProfit,
        juniorProfits,
        teamProfits
      }
    })

  } catch (error) {
    console.error('Error calculating profits:', error)
    return NextResponse.json(
      { success: false, error: 'Error calculating profits' },
      { status: 500 }
    )
  }
}

async function getOrCreateMonthlyAccounting(month: string) {
  try {
    let accounting = await prisma.monthlyAccounting.findUnique({
      where: { month }
    })

    if (!accounting) {
      // Get current GBP/USD rate (you can implement API call here)
      const rate = 1.3 // Default rate or fetch from API

      accounting = await prisma.monthlyAccounting.create({
        data: {
          month,
          gbpUsdRate: rate
        }
      })
    }

    return accounting
  } catch (error) {
    // Return default if DB not available
    return {
      month,
      gbpUsdRate: 1.3,
      totalBase: 0,
      totalSpending: 0,
      totalProfit: 0,
      isProcessed: false
    }
  }
}

async function saveEmployeeProfits(month: string, juniorProfits: any, teamProfits: any) {
  try {
    // Save junior profits
    for (const [nickname, profit] of Object.entries(juniorProfits)) {
      const employee = await prisma.employee.findUnique({
        where: { nickname }
      })

      if (employee) {
        await prisma.employeeProfit.upsert({
          where: {
            employeeId_month: {
              employeeId: employee.id,
              month
            }
          },
          update: {
            baseProfit: profit as number,
            totalProfit: profit as number
          },
          create: {
            employeeId: employee.id,
            month,
            baseProfit: profit as number,
            totalProfit: profit as number
          }
        })
      }
    }

    // Save team profits
    for (const [nickname, profit] of Object.entries(teamProfits)) {
      if (nickname === '@sobroffice') continue // Already handled above

      const employee = await prisma.employee.findUnique({
        where: { nickname }
      })

      if (employee) {
        await prisma.employeeProfit.upsert({
          where: {
            employeeId_month: {
              employeeId: employee.id,
              month
            }
          },
          update: {
            teamProfit: profit as number,
            totalProfit: (profit as number)
          },
          create: {
            employeeId: employee.id,
            month,
            teamProfit: profit as number,
            totalProfit: profit as number
          }
        })
      }
    }
  } catch (error) {
    console.log('Demo mode: Profits calculated but not saved to DB')
  }
}
