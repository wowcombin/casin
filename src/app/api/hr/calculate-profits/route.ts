import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

// Команда менеджеров и их проценты (как в Google Sheets скрипте)
const TEAM_PERCENTAGES = {
  '@i88jU': 0.05,      // 5%
  '@n1mbo': 0.10,      // 10%
  '@sobroffice': 0.10, // 10%
  '@zvr1903': 0.05     // 5%
}

async function getCurrentExchangeRate(): Promise<number> {
  // В реальной версии можно подключить API курса валют
  // Пока возвращаем курс по умолчанию как в скрипте
  return 1.3
}

export async function POST(request: Request) {
  try {
    const { month } = await request.json()
    
    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month is required' },
        { status: 400 }
      )
    }

    console.log(`Calculating profits for month: ${month}`)

    // Получаем текущий курс GBP/USD
    const rate = await getCurrentExchangeRate()

    // Получаем все рабочие данные за месяц
    const workData = await prisma.workData.findMany({
      where: { month },
      include: { employee: true }
    })

    // Получаем тестовые данные за месяц
    const testData = await prisma.testResult.findMany({
      where: { month },
      include: { employee: true }
    })

    console.log(`Found ${workData.length} work records and ${testData.length} test records`)

    // Инициализация переменных
    let totalProfit = 0
    let totalBase = 0
    const juniorProfits: Record<string, number> = {}
    const juniors: string[] = []
    const testedSites = new Set<string>()

    // Собираем уникальных сотрудников (juniors)
    workData.forEach(work => {
      if (!juniors.includes(work.employee.nickname)) {
        juniors.push(work.employee.nickname)
      }
    })

    // Определяем протестированные @sobroffice сайты
    workData.forEach(work => {
      if (work.employee.nickname === '@sobroffice' && work.casino) {
        testedSites.add(work.casino)
      }
    })

    console.log(`Juniors: ${juniors.join(', ')}`)
    console.log(`Tested sites by @sobroffice: ${Array.from(testedSites).join(', ')}`)

    // Расчет прибыли для juniors из рабочих данных
    workData.forEach(work => {
      const deposit = work.deposit || 0
      const withdrawal = work.withdrawal || 0
      const nickname = work.employee.nickname

      // Формула как в Google Sheets: (withdrawal - deposit) * rate * 0.97 * 0.1
      const calculation = (withdrawal - deposit) * rate * 0.97 * 0.1 // 10% profit
      const base = (withdrawal - deposit) * rate * 0.97

      totalProfit += calculation
      totalBase += base

      // Накапливаем прибыль для juniors
      if (juniors.includes(nickname)) {
        if (!juniorProfits[nickname]) {
          juniorProfits[nickname] = 0
        }
        juniorProfits[nickname] += calculation

        // Для @sobroffice добавляем 10% от базового профита протестированных сайтов
        if (nickname === '@sobroffice' && testedSites.has(work.casino)) {
          juniorProfits[nickname] += base * 0.1 // 10% от базового профита
        }
      }
    })

    // Добавляем прибыль от тестов для @sobroffice
    testData.forEach(test => {
      const deposit = test.deposit || 0
      const withdrawal = test.withdrawal || 0
      const testCalculation = (withdrawal - deposit) * rate * 0.97 * 0.1 // 10% от тестов

      if (!juniorProfits['@sobroffice']) {
        juniorProfits['@sobroffice'] = 0
      }
      juniorProfits['@sobroffice'] += testCalculation
    })

    // Добавляем бонус +200 для juniors с прибылью > 200
    const juniorResults: Array<{nickname: string, profit: number}> = []
    Object.keys(juniorProfits).forEach(nickname => {
      let profit = juniorProfits[nickname]
      if (profit > 200) {
        profit += 200 // Бонус как в скрипте
      }
      juniorResults.push({ nickname, profit })
    })

    // Расчет прибыли команды (менеджеров)
    // TODO: В будущем можно добавить учет расходов из таблицы Spending
    const totalSpending = 0 // Пока нет данных о расходах
    const isExceed = totalSpending > 0.25 * totalBase
    const baseForTeam = isExceed ? totalBase - totalSpending : totalBase

    const teamResults: Array<{nickname: string, profit: number}> = []
    Object.keys(TEAM_PERCENTAGES).forEach(member => {
      const percent = TEAM_PERCENTAGES[member]
      const memberProfit = percent * baseForTeam

      teamResults.push({ nickname: member, profit: memberProfit })

      // Для @sobroffice добавляем его долю от команды к существующей прибыли
      if (member === '@sobroffice') {
        const sobrofficeIndex = juniorResults.findIndex(j => j.nickname === '@sobroffice')
        if (sobrofficeIndex >= 0) {
          juniorResults[sobrofficeIndex].profit += memberProfit
        } else {
          juniorResults.push({ nickname: '@sobroffice', profit: memberProfit })
        }
      }
    })

    // Сохраняем месячную отчетность
    await prisma.monthlyAccounting.upsert({
      where: { month },
      update: { gbpUsdRate: rate },
      create: {
        month,
        gbpUsdRate: rate
      }
    })

    const results = {
      month,
      rate,
      totalBase: totalBase.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      juniors: juniorResults,
      team: teamResults,
      summary: {
        workRecords: workData.length,
        testRecords: testData.length,
        totalEmployees: juniors.length,
        teamMembers: Object.keys(TEAM_PERCENTAGES).length
      }
    }

    console.log('Calculation results:', results)

    const message = `Расчет завершен для ${month}:
• Курс GBP/USD: ${rate}
• Общая база: $${totalBase.toFixed(2)}
• Общая прибыль: $${totalProfit.toFixed(2)}
• Обработано записей: ${workData.length + testData.length}
• Сотрудников: ${juniors.length}
• Команда: ${Object.keys(TEAM_PERCENTAGES).length}`

    return NextResponse.json({
      success: true,
      data: { ...results, message }
    })

  } catch (error: any) {
    console.error('Error calculating profits:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
