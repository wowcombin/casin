import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: Request) {
  try {
    const { month } = await request.json()

    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month is required' },
        { status: 400 }
      )
    }

    console.log(`Starting profit calculation for ${month}`)

    // Получаем курс из MonthlyAccounting или используем дефолтный
    const monthAccounting = await prisma.monthlyAccounting.findUnique({
      where: { month }
    })
    
    const rate = monthAccounting?.gbpUsdRate || 1.27
    const totalSpending = monthAccounting?.totalSpending || 0

    // Получаем всех активных сотрудников с их данными за месяц
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        workData: {
          where: { month }
        },
        testResults: {
          where: { month }
        }
      }
    })

    // Инициализация переменных
    let totalBase = 0
    let totalProfit = 0
    const juniorProfits: Record<string, number> = {}
    const testedSites = new Set<string>()

    // Определяем команду менеджеров и их проценты
    const team: Record<string, number> = {
      '@i88jU': 0.05,
      '@n1mbo': 0.10,
      '@sobroffice': 0.10,
      '@zvr1903': 0.05
    }

    // Собираем все протестированные сайты от @sobroffice
    const sobrofficeEmployee = employees.find(e => e.nickname === '@sobroffice')
    if (sobrofficeEmployee) {
      // Из рабочих данных
      sobrofficeEmployee.workData.forEach(data => {
        if (data.casino) {
          testedSites.add(data.casino)
        }
      })
      // Из тестовых данных
      sobrofficeEmployee.testResults.forEach(data => {
        if (data.casino) {
          testedSites.add(data.casino)
        }
      })
    }

    // ОБРАБАТЫВАЕМ ВСЕХ СОТРУДНИКОВ (не только @sobroffice)
    for (const employee of employees) {
      // Инициализируем прибыль для сотрудника
      if (!juniorProfits[employee.nickname]) {
        juniorProfits[employee.nickname] = 0
      }

      // Обрабатываем рабочие данные для ВСЕХ
      for (const data of employee.workData) {
        const deposit = data.deposit || 0
        const withdrawal = data.withdrawal || 0
        
        // Базовая формула для всех: (withdrawal - deposit) * rate * 0.97 * 0.1
        const calculation = (withdrawal - deposit) * rate * 0.97 * 0.1
        
        juniorProfits[employee.nickname] += calculation
        totalProfit += calculation
        
        // Базовый профит для расчета команды
        const base = (withdrawal - deposit) * rate * 0.97
        totalBase += base
        
        // Дополнительные 10% для @sobroffice от протестированных им сайтов
        if (employee.nickname === '@sobroffice' && testedSites.has(data.casino)) {
          const siteBaseProfit = (withdrawal - deposit) * rate * 0.97
          const extraProfit = siteBaseProfit * 0.1
          juniorProfits[employee.nickname] += extraProfit
          console.log(`Extra profit for @sobroffice from tested site ${data.casino}: ${extraProfit}`)
        }
      }

      // Обрабатываем тестовые данные (только для тех у кого они есть, обычно @sobroffice)
      for (const testData of employee.testResults) {
        const deposit = testData.deposit || 0
        const withdrawal = testData.withdrawal || 0
        
        // 10% от тестов
        const testCalculation = (withdrawal - deposit) * rate * 0.97 * 0.1
        juniorProfits[employee.nickname] += testCalculation
        
        // Добавляем в общий базовый профит
        const testBase = (withdrawal - deposit) * rate * 0.97
        totalBase += testBase
        totalProfit += testCalculation
        
        console.log(`Test profit for ${employee.nickname} from ${testData.casino}: ${testCalculation}`)
      }
    }

    // Применяем бонус +200 для всех juniors с прибылью > 200
    const juniorProfitsWithBonus: Record<string, number> = {}
    for (const [nickname, profit] of Object.entries(juniorProfits)) {
      let finalProfit = profit
      if (profit > 200) {
        finalProfit += 200
        console.log(`Bonus +200 applied for ${nickname}`)
      }
      juniorProfitsWithBonus[nickname] = finalProfit
    }

    // Расчет прибыли для команды менеджеров
    const teamProfits: Record<string, number> = {}
    
    // Проверяем, превышают ли расходы 25% от базового профита
    const isExceed = totalSpending > 0.25 * totalBase
    const baseForTeam = isExceed ? totalBase - totalSpending : totalBase
    
    console.log(`Base for team calculation: ${baseForTeam} (spending: ${totalSpending}, exceed 25%: ${isExceed})`)
    
    // Рассчитываем доли команды
    for (const [member, percent] of Object.entries(team)) {
      const memberProfit = percent * baseForTeam
      teamProfits[member] = memberProfit
      
      // Для @sobroffice суммируем его долю от команды с его junior прибылью
      if (member === '@sobroffice') {
        if (!juniorProfitsWithBonus['@sobroffice']) {
          juniorProfitsWithBonus['@sobroffice'] = 0
        }
        juniorProfitsWithBonus['@sobroffice'] += memberProfit
        console.log(`Team profit for @sobroffice: ${memberProfit}`)
      } else {
        // Для остальных членов команды, которые не в juniors
        if (!juniorProfitsWithBonus[member]) {
          teamProfits[member] = memberProfit
        }
      }
    }

    // Подготавливаем финальный результат
    const allProfits: Array<{nickname: string, profit: number}> = []
    
    // Добавляем всех juniors с их итоговой прибылью
    for (const [nickname, profit] of Object.entries(juniorProfitsWithBonus)) {
      allProfits.push({
        nickname,
        profit: parseFloat(profit.toFixed(2))
      })
    }
    
    // Добавляем членов команды, которые не в juniors
    for (const [nickname, profit] of Object.entries(teamProfits)) {
      if (!juniorProfitsWithBonus[nickname]) {
        allProfits.push({
          nickname,
          profit: parseFloat(profit.toFixed(2))
        })
      }
    }

    // Сортируем по прибыли (от большей к меньшей)
    allProfits.sort((a, b) => b.profit - a.profit)

    // Результат
    const result = {
      month,
      rate,
      totalBase: parseFloat(totalBase.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalSpending,
      employees: allProfits,
      juniors: Object.entries(juniorProfitsWithBonus).map(([nickname, profit]) => ({
        nickname,
        profit: parseFloat(profit.toFixed(2))
      })),
      team: Object.entries(team).map(([nickname, percent]) => ({
        nickname,
        percent: percent * 100,
        profit: parseFloat((percent * baseForTeam).toFixed(2))
      })),
      message: `Расчет завершен для ${employees.length} сотрудников. Общая база: $${totalBase.toFixed(2)}, Общая прибыль: $${totalProfit.toFixed(2)}`
    }

    console.log('Profit calculation completed:', result)

    // Опционально: сохраняем результаты в базу
    try {
      await prisma.monthlyProfit.upsert({
        where: { month },
        update: { data: result },
        create: { month, data: result }
      })
    } catch (saveError) {
      console.log('Could not save monthly profit:', saveError)
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error: any) {
    console.error('Error calculating profits:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
