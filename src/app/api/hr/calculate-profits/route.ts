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

    // Get current GBP/USD rate (demo version)
    const rate = 1.3 // You can implement real API call here

    console.log(`Calculating profits for ${month} with rate ${rate}`)

    // Demo calculation (since DB tables don't exist yet)
    const demoWorkData = [
      { employee: '@opporenno', casino: 'Royal Casino', deposit: 1000, withdrawal: 1200, card: 'Card1' },
      { employee: '@sobroffice', casino: 'Lucky Spin', deposit: 500, withdrawal: 750, card: 'Card2' }
    ]

    const demoTestResults = [
      { employee: '@sobroffice', casino: 'Test Casino', deposit: 300, withdrawal: 450, card: 'TestCard' }
    ]

    // Calculate profits
    const juniorProfits: { [key: string]: number } = {}
    let totalBase = 0
    let totalProfit = 0
    const totalSpending = 0 // Demo value

    // Process work data
    for (const work of demoWorkData) {
      const base = (work.withdrawal - work.deposit) * rate * 0.97
      const calculation = base * 0.1 // 10% profit
      
      totalBase += base
      totalProfit += calculation

      const nickname = work.employee
      if (!juniorProfits[nickname]) {
        juniorProfits[nickname] = 0
      }
      juniorProfits[nickname] += calculation
    }

    // Add test results for @sobroffice
    for (const test of demoTestResults) {
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

    const teamProfits: { [key: string]: number } = {}
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

    console.log('Calculation completed:', {
      juniorProfits,
      teamProfits,
      totalBase,
      totalProfit
    })

    return NextResponse.json({
      success: true,
      data: {
        month,
        rate,
        totalBase: Math.round(totalBase * 100) / 100,
        totalSpending,
        totalProfit: Math.round(totalProfit * 100) / 100,
        juniorProfits,
        teamProfits,
        message: 'Расчет выполнен успешно (демо данные)'
      }
    })

  } catch (error) {
    console.error('Error calculating profits:', error)
    return NextResponse.json(
      { success: false, error: 'Error calculating profits: ' + error.message },
      { status: 500 }
    )
  }
}
