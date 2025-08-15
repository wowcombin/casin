import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    
    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month parameter required' },
        { status: 400 }
      )
    }

    // Get work data for the month
    const workData = await prisma.workData.findMany({
      where: { month },
      include: { employee: true },
      orderBy: { id: 'asc' }
    })

    // Get test data for the month
    const testData = await prisma.testResult.findMany({
      where: { month },
      include: { employee: true },
      orderBy: { id: 'asc' }
    })

    // Get exchange rate
    const monthlyData = await prisma.monthlyAccounting.findUnique({
      where: { month }
    })

    const rate = monthlyData?.gbpUsdRate || 1.27

    // Calculate site profits
    const siteProfits = {}
    
    // Process work data
    for (const work of workData) {
      const site = work.casino
      const profit = (work.withdrawal - work.deposit) * rate
      
      if (!siteProfits[site]) {
        siteProfits[site] = 0
      }
      siteProfits[site] += profit
    }

    // Process test data
    for (const test of testData) {
      const site = test.casino
      const profit = (test.withdrawal - test.deposit) * rate
      
      if (!siteProfits[site]) {
        siteProfits[site] = 0
      }
      siteProfits[site] += profit
    }

    // Sort sites by profit
    const sortedSites = Object.entries(siteProfits)
      .sort(([,a], [,b]) => b - a)
      .map(([site, profit]) => ({ site, profit }))

    // Calculate employee profits
    const employeeProfits = {}
    
    // Process work data for employee profits
    for (const work of workData) {
      const nickname = work.employee.nickname
      const calculation = (work.withdrawal - work.deposit) * rate * 0.97 * 0.1 // 10% profit
      
      if (!employeeProfits[nickname]) {
        employeeProfits[nickname] = 0
      }
      employeeProfits[nickname] += calculation
    }

    // Process test data for @sobroffice
    for (const test of testData) {
      const nickname = '@sobroffice'
      const calculation = (test.withdrawal - test.deposit) * rate * 0.97 * 0.1 // 10% profit
      
      if (!employeeProfits[nickname]) {
        employeeProfits[nickname] = 0
      }
      employeeProfits[nickname] += calculation
    }

    // Add bonus for profits > 200
    for (const nickname in employeeProfits) {
      if (employeeProfits[nickname] > 200) {
        employeeProfits[nickname] += 200
      }
    }

    // Sort employees by profit
    const sortedEmployees = Object.entries(employeeProfits)
      .sort(([,a], [,b]) => b - a)
      .map(([nickname, profit]) => ({ nickname, profit }))

    // Calculate total profit
    const totalProfit = sortedSites.reduce((sum, site) => sum + site.profit, 0)

    return NextResponse.json({
      success: true,
      data: {
        month,
        rate,
        workData: workData.map(w => ({
          nickname: w.employee.nickname,
          casino: w.casino,
          card: w.card,
          deposit: w.deposit,
          withdrawal: w.withdrawal,
          calculation: (w.withdrawal - w.deposit) * rate * 0.97 * 0.1
        })),
        testData: testData.map(t => ({
          nickname: '@sobroffice',
          casino: t.casino,
          card: t.card,
          deposit: t.deposit,
          withdrawal: t.withdrawal,
          calculation: (t.withdrawal - t.deposit) * rate * 0.97 * 0.1
        })),
        siteProfits: sortedSites,
        employeeProfits: sortedEmployees,
        totalProfit,
        stats: {
          totalRecords: workData.length + testData.length,
          totalEmployees: sortedEmployees.length,
          totalSites: sortedSites.length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching monthly data:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
