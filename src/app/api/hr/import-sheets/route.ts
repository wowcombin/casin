import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { google } from 'googleapis'
import { cookies } from 'next/headers'

async function getAuthClient(request?: NextRequest) {
  try {
    const cookieStore = cookies()
    const origin = request?.nextUrl.origin || process.env.NEXT_PUBLIC_BASE_URL || 'https://casin.vercel.app'
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`
    )

    const refreshToken = cookieStore.get('google_refresh_token')?.value
    const accessToken = cookieStore.get('google_access_token')?.value

    const tokens = {
      refresh_token: refreshToken || process.env.GOOGLE_REFRESH_TOKEN,
      access_token: accessToken || process.env.GOOGLE_ACCESS_TOKEN
    }

    if (tokens.refresh_token) {
      oauth2Client.setCredentials(tokens)
      return { client: oauth2Client, authorized: true }
    }

    return { client: oauth2Client, authorized: false }
  } catch (error: any) {
    console.error('Error getting auth client:', error)
    return { client: null, authorized: false, error: error.message }
  }
}

export async function GET(request: NextRequest) {
  console.log('GET /api/hr/import-sheets - checking authorization')
  
  try {
    const authResult = await getAuthClient(request)
    
    if (!authResult.client) {
      console.error('Failed to create OAuth client:', authResult.error)
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize Google OAuth',
        data: {
          status: 'error',
          message: authResult.error || 'OAuth client initialization failed'
        }
      })
    }
    
    if (!authResult.authorized) {
      console.log('Not authorized, need to authenticate')
      return NextResponse.json({
        success: false,
        needsAuth: true,
        data: {
          status: 'not_authenticated',
          message: 'Требуется авторизация Google Drive',
          authUrl: `/api/auth/google`
        }
      })
    }

    const drive = google.drive({ version: 'v3', auth: authResult.client })
    
    try {
      const juniorFolderId = '1FEtrBtiv5ZpxV4C9paFzKf8aQuNdwRdu'
      
      const folderResponse = await drive.files.get({
        fileId: juniorFolderId,
        fields: 'name, id'
      })

      const foldersResponse = await drive.files.list({
        q: `'${juniorFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
        pageSize: 100
      })

      const employeeFolders = foldersResponse.data.files || []
      const employees = employeeFolders
        .map(f => f.name?.replace('WORK ', ''))
        .filter(Boolean)

      return NextResponse.json({
        success: true,
        data: {
          status: 'authenticated',
          folderName: folderResponse.data.name,
          employeeFolders: employeeFolders.length,
          employees: employees.slice(0, 5),
          message: 'Google Drive подключен успешно'
        }
      })
    } catch (driveError: any) {
      console.error('Drive access error:', driveError)
      return NextResponse.json({
        success: false,
        error: driveError.message,
        data: {
          status: 'error',
          message: 'Ошибка доступа к Google Drive',
          details: driveError.message
        }
      })
    }

  } catch (error: any) {
    console.error('Error in GET /api/hr/import-sheets:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      data: {
        status: 'error',
        message: 'Внутренняя ошибка сервера'
      }
    })
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('POST /api/hr/import-sheets - starting import')
  
  try {
    const body = await request.json()
    const { month } = body
    
    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month is required' },
        { status: 400 }
      )
    }

    const sheetMonth = month.split(' ')[0]
    
    const authResult = await getAuthClient(request)
    
    if (!authResult.client || !authResult.authorized) {
      return NextResponse.json({
        success: false,
        needsAuth: true,
        error: 'Требуется авторизация Google'
      })
    }

    const drive = google.drive({ version: 'v3', auth: authResult.client })
    const sheets = google.sheets({ version: 'v4', auth: authResult.client })

    const juniorFolderId = '1FEtrBtiv5ZpxV4C9paFzKf8aQuNdwRdu'
    
    const foldersResponse = await drive.files.list({
      q: `'${juniorFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
      pageSize: 100
    })

    const employeeFolders = foldersResponse.data.files || []
    console.log(`Found ${employeeFolders.length} employee folders`)

    if (employeeFolders.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Не найдено папок сотрудников'
      })
    }

    let importedCount = 0
    const processedEmployees: string[] = []
    const dataToInsert: any[] = []
    const testDataToInsert: any[] = []
    const spendingToInsert: any[] = []

    // Удаляем старые данные
    await prisma.workData.deleteMany({ where: { month } })
    await prisma.testResult.deleteMany({ where: { month } })
    
    // Удаляем старые расходы если таблица существует
    try {
      await prisma.monthlySpending.deleteMany({ where: { month } })
    } catch (e) {
      console.log('MonthlySpending table not found, skipping')
    }

    // Обрабатываем папки батчами
    const batchSize = 5
    for (let i = 0; i < employeeFolders.length; i += batchSize) {
      const batch = employeeFolders.slice(i, i + batchSize)
      
      if (Date.now() - startTime > 8000) {
        console.log('Approaching timeout, saving partial data')
        break
      }
      
      const batchPromises = batch.map(async (folder) => {
        try {
          const folderName = folder.name || ''
          const nickname = folderName.replace('WORK ', '').trim()
          
          if (!nickname.startsWith('@')) {
            return null
          }

          let employee = await prisma.employee.findUnique({
            where: { nickname }
          })

          if (!employee) {
            employee = await prisma.employee.create({
              data: {
                nickname,
                role: nickname === '@sobroffice' ? 'TESTER' : 'JUNIOR',
                isActive: true
              }
            })
          }

          const filesResponse = await drive.files.list({
            q: `'${folder.id}' in parents and name contains 'WORK' and mimeType='application/vnd.google-apps.spreadsheet'`,
            fields: 'files(id, name)',
            pageSize: 1
          })

          const workFile = filesResponse.data.files?.[0]
          if (!workFile) {
            return null
          }

          try {
            const range = `${sheetMonth}!A2:D1000`
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: workFile.id!,
              range: range
            })
            
            if (response.data.values && response.data.values.length > 0) {
              const rows = response.data.values
              let employeeImportCount = 0
              
              for (const row of rows) {
                const [casino, depositStr, withdrawalStr, card] = row
                
                if (!casino || casino.toString().trim() === '') continue
                
                const deposit = parseFloat(depositStr) || 0
                const withdrawal = parseFloat(withdrawalStr) || 0
                
                if (deposit === 0 && withdrawal === 0) continue
                
                dataToInsert.push({
                  employeeId: employee.id,
                  month,
                  casino: casino.toString().trim(),
                  deposit,
                  withdrawal,
                  card: card?.toString().trim() || 'N/A'
                })
                
                employeeImportCount++
              }
              
              if (employeeImportCount > 0) {
                return `${nickname} (${employeeImportCount})`
              }
            }
          } catch (err: any) {
            console.log(`Failed to read data for ${nickname}:`, err.message)
          }
          
          return null
        } catch (error: any) {
          console.error(`Error processing ${folder.name}:`, error.message)
          return null
        }
      })

      const results = await Promise.all(batchPromises)
      
      results.forEach(result => {
        if (result) {
          processedEmployees.push(result)
        }
      })
    }

    // Импорт тестовых данных
    try {
      const testSpreadsheetId = '1i0IbJgxn7WwNH7T7VmOKz_xkH0GMfyGgpKKJqEmQqvA'
      
      let sobroffice = await prisma.employee.findUnique({
        where: { nickname: '@sobroffice' }
      })

      if (!sobroffice) {
        sobroffice = await prisma.employee.create({
          data: {
            nickname: '@sobroffice',
            role: 'TESTER',
            isActive: true
          }
        })
      }

      const testRange = `${sheetMonth}!A2:D1000`
      const testData = await sheets.spreadsheets.values.get({
        spreadsheetId: testSpreadsheetId,
        range: testRange
      })

      if (testData.data.values) {
        for (const row of testData.data.values) {
          const [casino, depositStr, withdrawalStr, card] = row
          
          if (!casino || casino.toString().trim() === '') continue
          
          const deposit = parseFloat(depositStr) || 0
          const withdrawal = parseFloat(withdrawalStr) || 0
          
          if (deposit === 0 && withdrawal === 0) continue
          
          testDataToInsert.push({
            employeeId: sobroffice.id,
            month,
            casino: casino.toString().trim(),
            deposit,
            withdrawal,
            card: card?.toString().trim() || 'N/A'
          })
        }
      }
    } catch (testError: any) {
      console.log('Could not import test data:', testError.message)
    }

    // Импорт расходов
    let totalSpending = 0
    try {
      const accountingSpreadsheetId = '19LmZTOzZoX8eMhGPazMl9g_VPmOZ3YwMURWqcrvKkAU'
      const spendingRange = `${sheetMonth} Spending!A2:C100`
      
      console.log('Importing spending data from:', spendingRange)
      
      const spendingData = await sheets.spreadsheets.values.get({
        spreadsheetId: accountingSpreadsheetId,
        range: spendingRange
      })

      if (spendingData.data.values) {
        for (const row of spendingData.data.values) {
          const [name, costStr, date] = row
          
          if (!name || !costStr) continue
          
          const cost = parseFloat(costStr) || 0
          totalSpending += cost
          
          spendingToInsert.push({
            month,
            name: name.toString().trim(),
            cost,
            date: date?.toString().trim() || null
          })
        }
        console.log(`Total spending for ${sheetMonth}: ${totalSpending}`)
      }
    } catch (spendingError: any) {
      console.log('Could not import spending data:', spendingError.message)
    }

    // Массовая вставка данных
    if (dataToInsert.length > 0) {
      await prisma.workData.createMany({
        data: dataToInsert
      })
      importedCount += dataToInsert.length
    }

    if (testDataToInsert.length > 0) {
      await prisma.testResult.createMany({
        data: testDataToInsert
      })
      importedCount += testDataToInsert.length
    }

    // Сохраняем расходы если таблица существует
    if (spendingToInsert.length > 0) {
      try {
        await prisma.monthlySpending.createMany({
          data: spendingToInsert
        })
        console.log(`Saved ${spendingToInsert.length} spending records`)
      } catch (e) {
        console.log('Could not save spending records:', e)
      }
    }

    // Обновляем месячный учет БЕЗ totalSpending
    await prisma.monthlyAccounting.upsert({
      where: { month },
      update: { 
        gbpUsdRate: 1.27
      },
      create: { 
        month, 
        gbpUsdRate: 1.27
      }
    })

    const executionTime = Date.now() - startTime
    console.log(`Import completed in ${executionTime}ms`)

    const successMessage = importedCount > 0 
      ? `Импорт завершен!\n\n📊 Импортировано: ${importedCount} записей\n💰 Расходы: $${totalSpending.toFixed(2)}\n\n👥 Обработано сотрудников:\n${processedEmployees.join('\n')}`
      : `Импорт завершен. Данные не найдены для месяца "${sheetMonth}".`
    
    return NextResponse.json({
      success: true,
      data: {
        message: successMessage,
        imported: importedCount,
        spending: totalSpending,
        processed: processedEmployees,
        executionTime: `${executionTime}ms`
      }
    })

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown import error'
    })
  }
}
