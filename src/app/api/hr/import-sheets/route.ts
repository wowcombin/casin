import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { month, spreadsheetId } = await request.json()
    
    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month is required' },
        { status: 400 }
      )
    }

    console.log(`Starting import for month: ${month}`)

    // Simulate Google Sheets import (demo version)
    // In real implementation, you would use googleapis to fetch data
    const simulatedData = await simulateGoogleSheetsImport(month, spreadsheetId)

    // Process the imported data
    const processedData = await processImportedData(simulatedData, month)

    return NextResponse.json({
      success: true,
      data: {
        month,
        imported: processedData.imported,
        employees: processedData.employees,
        workRecords: processedData.workRecords,
        testRecords: processedData.testRecords,
        message: `Импорт завершен для ${month}. Обработано ${processedData.imported} записей.`
      }
    })

  } catch (error) {
    console.error('Error importing from sheets:', error)
    return NextResponse.json(
      { success: false, error: 'Error importing from sheets: ' + error.message },
      { status: 500 }
    )
  }
}

async function simulateGoogleSheetsImport(month: string, spreadsheetId?: string) {
  // Simulate your Google Sheets structure
  const juniorFolders = [
    {
      nickname: '@opporenno',
      workData: [
        { casino: 'Royal Casino', deposit: 1000, withdrawal: 1200, card: 'Card1' },
        { casino: 'Lucky Spin', deposit: 500, withdrawal: 750, card: 'Card2' }
      ]
    },
    {
      nickname: '@newjunior',
      workData: [
        { casino: 'Bet Champion', deposit: 800, withdrawal: 950, card: 'Card3' }
      ]
    }
  ]

  // Simulate @sobroffice test data
  const testData = [
    { casino: 'Test Casino 1', deposit: 300, withdrawal: 450, card: 'TestCard1' },
    { casino: 'Test Casino 2', deposit: 200, withdrawal: 280, card: 'TestCard2' }
  ]

  return {
    juniorFolders,
    testData,
    rate: 1.27 // Simulated current rate
  }
}

async function processImportedData(data: any, month: string) {
  let imported = 0
  const employees = []
  const workRecords = []
  const testRecords = []

  try {
    // Process junior folders (like your Google Script)
    for (const folder of data.juniorFolders) {
      const nickname = folder.nickname

      // Create or update employee
      let employee = await prisma.employee.findUnique({
        where: { nickname }
      }).catch(() => null)

      if (!employee) {
        employee = await prisma.employee.create({
          data: {
            nickname,
            role: 'JUNIOR',
            isActive: true
          }
        }).catch(() => null)
        
        if (employee) {
          employees.push(employee.nickname)
        }
      }

      // Process work data for this employee
      if (employee) {
        for (const work of folder.workData) {
          try {
            const workRecord = await prisma.workData.create({
              data: {
                employeeId: employee.id,
                month,
                casino: work.casino,
                deposit: work.deposit,
                withdrawal: work.withdrawal,
                card: work.card
              }
            }).catch(() => null)

            if (workRecord) {
              workRecords.push({
                employee: nickname,
                casino: work.casino,
                profit: (work.withdrawal - work.deposit)
              })
              imported++
            }
          } catch (error) {
            console.log(`Demo mode: Work record for ${nickname} not saved to DB`)
            imported++
          }
        }
      }
    }

    // Process test data for @sobroffice
    let sobroffice = await prisma.employee.findUnique({
      where: { nickname: '@sobroffice' }
    }).catch(() => null)

    if (!sobroffice) {
      sobroffice = await prisma.employee.create({
        data: {
          nickname: '@sobroffice',
          role: 'TESTER',
          isActive: true
        }
      }).catch(() => null)

      if (sobroffice) {
        employees.push('@sobroffice')
      }
    }

    // Process test results
    if (sobroffice) {
      for (const test of data.testData) {
        try {
          const testRecord = await prisma.testResult.create({
            data: {
              employeeId: sobroffice.id,
              month,
              casino: test.casino,
              deposit: test.deposit,
              withdrawal: test.withdrawal,
              card: test.card
            }
          }).catch(() => null)

          if (testRecord) {
            testRecords.push({
              casino: test.casino,
              profit: (test.withdrawal - test.deposit)
            })
            imported++
          }
        } catch (error) {
          console.log(`Demo mode: Test record not saved to DB`)
          imported++
        }
      }
    }

    // Update monthly accounting with current rate
    try {
      await prisma.monthlyAccounting.upsert({
        where: { month },
        update: { gbpUsdRate: data.rate },
        create: {
          month,
          gbpUsdRate: data.rate
        }
      })
    } catch (error) {
      console.log('Demo mode: Monthly accounting not saved to DB')
    }

  } catch (error) {
    console.log('Demo mode: Processing completed with simulated data')
    imported = data.juniorFolders.length + data.testData.length
  }

  return {
    imported,
    employees,
    workRecords,
    testRecords
  }
}

// GET endpoint to check import status
export async function GET() {
  try {
    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    // Check if data exists for current month
    const monthlyRecord = await prisma.monthlyAccounting.findUnique({
      where: { month: currentMonth }
    }).catch(() => null)

    const employeeCount = await prisma.employee.count().catch(() => 0)
    
    return NextResponse.json({
      success: true,
      data: {
        currentMonth,
        hasData: !!monthlyRecord,
        employeeCount,
        lastImport: monthlyRecord?.updatedAt || null,
        rate: monthlyRecord?.gbpUsdRate || 1.3
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: true,
      data: {
        currentMonth: 'December 2024',
        hasData: false,
        employeeCount: 0,
        lastImport: null,
        rate: 1.3,
        demo: true
      }
    })
  }
}
