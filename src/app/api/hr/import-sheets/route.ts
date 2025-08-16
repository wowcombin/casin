import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { google } from 'googleapis'
import { cookies } from 'next/headers'

// Получаем OAuth клиент с токенами
async function getAuthClient(request?: NextRequest) {
  try {
    const cookieStore = cookies()
    const origin = request?.nextUrl.origin || process.env.NEXT_PUBLIC_BASE_URL || 'https://casin.vercel.app'
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${origin}/api/auth/google/callback`
    )

    // Пробуем получить токены из cookies
    const refreshToken = cookieStore.get('google_refresh_token')?.value
    const accessToken = cookieStore.get('google_access_token')?.value

    // Или из переменных окружения (для продакшена)
    const tokens = {
      refresh_token: refreshToken || process.env.GOOGLE_REFRESH_TOKEN,
      access_token: accessToken || process.env.GOOGLE_ACCESS_TOKEN
    }

    console.log('Auth tokens status:', {
      hasRefreshToken: !!tokens.refresh_token,
      hasAccessToken: !!tokens.access_token,
      source: refreshToken ? 'cookies' : 'env'
    })

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

    // Если авторизованы, проверяем доступ
    const drive = google.drive({ version: 'v3', auth: authResult.client })
    
    try {
      console.log('Checking access to Junior folder...')
      const juniorFolderId = '1FEtrBtiv5ZpxV4C9paFzKf8aQuNdwRdu'
      
      const folderResponse = await drive.files.get({
        fileId: juniorFolderId,
        fields: 'name, id'
      })

      console.log('Folder found:', folderResponse.data.name)

      const foldersResponse = await drive.files.list({
        q: `'${juniorFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
        fields: 'files(id, name)',
        pageSize: 100
      })

      const employeeFolders = foldersResponse.data.files || []
      const employees = employeeFolders
        .map(f => f.name?.replace('WORK ', ''))
        .filter(Boolean)

      console.log(`Found ${employeeFolders.length} employee folders`)

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
      
      // Если ошибка 404 - папка не найдена
      if (driveError.code === 404) {
        return NextResponse.json({
          success: false,
          error: 'Папка Junior не найдена. Проверьте ID папки.',
          data: {
            status: 'error',
            message: 'Папка с ID 1FEtrBtiv5ZpxV4C9paFzKf8aQuNdwRdu не найдена'
          }
        })
      }
      
      // Если ошибка 403 - нет доступа
      if (driveError.code === 403) {
        return NextResponse.json({
          success: false,
          error: 'Нет доступа к папке. Дайте доступ аккаунту.',
          data: {
            status: 'error',
            message: 'Нет прав доступа к папке Junior'
          }
        })
      }
      
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
  console.log('POST /api/hr/import-sheets - starting import')
  
  try {
    const body = await request.json()
    const { month } = body
    
    console.log('Import request for month:', month)

    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month is required' },
        { status: 400 }
      )
    }

    // Проверяем авторизацию
    const authResult = await getAuthClient(request)
    
    if (!authResult.client) {
      console.error('Failed to create OAuth client:', authResult.error)
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize Google OAuth'
      })
    }
    
    if (!authResult.authorized) {
      console.log('Not authorized for import')
      return NextResponse.json({
        success: false,
        needsAuth: true,
        error: 'Требуется авторизация Google'
      })
    }

    const drive = google.drive({ version: 'v3', auth: authResult.client })
    const sheets = google.sheets({ version: 'v4', auth: authResult.client })

    console.log(`Starting import process for month: ${month}`)

    // ID папки Junior
    const juniorFolderId = '1FEtrBtiv5ZpxV4C9paFzKf8aQuNdwRdu'
    
    // Получаем список папок сотрудников
    console.log('Fetching employee folders...')
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
        error: 'Не найдено папок сотрудников в папке Junior'
      })
    }

    let importedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Удаляем старые данные за этот месяц
    console.log('Deleting old data for month:', month)
    const deleteWorkResult = await prisma.workData.deleteMany({ where: { month } })
    const deleteTestResult = await prisma.testResult.deleteMany({ where: { month } })
    console.log(`Deleted ${deleteWorkResult.count} work records and ${deleteTestResult.count} test records`)

    // Обрабатываем каждую папку сотрудника
    for (const folder of employeeFolders) {
      try {
        const folderName = folder.name || ''
        const nickname = folderName.replace('WORK ', '').trim()
        
        if (!nickname.startsWith('@')) {
          console.log(`Skipping folder ${folderName} - not a valid nickname`)
          continue
        }

        console.log(`Processing employee: ${nickname}`)

        // Создаем или находим сотрудника
        let employee = await prisma.employee.findUnique({
          where: { nickname }
        })

        if (!employee) {
          console.log(`Creating new employee: ${nickname}`)
          employee = await prisma.employee.create({
            data: {
              nickname,
              role: nickname === '@sobroffice' ? 'TESTER' : 'JUNIOR',
              isActive: true
            }
          })
        }

        // Ищем файл WORK @username в папке
        console.log(`Looking for WORK file in folder ${folder.id}`)
        const filesResponse = await drive.files.list({
          q: `'${folder.id}' in parents and name contains 'WORK' and mimeType='application/vnd.google-apps.spreadsheet'`,
          fields: 'files(id, name)',
          pageSize: 10
        })

        const workFile = filesResponse.data.files?.[0]
        if (!workFile) {
          console.log(`No WORK file found for ${nickname}`)
          continue
        }

        console.log(`Found WORK file: ${workFile.name} (${workFile.id})`)

        // Читаем данные из листа месяца
        const range = `${month}!A2:D100` // A-Casino, B-Deposit, C-Withdrawal, D-Card
        
        try {
          console.log(`Reading sheet data from range: ${range}`)
          const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId: workFile.id!,
            range: range
          })

          const rows = sheetData.data.values || []
          console.log(`Found ${rows.length} rows for ${nickname}`)
          
          for (const row of rows) {
            const [casino, depositStr, withdrawalStr, card] = row
            
            if (!casino || casino === 'Unknown') continue
            
            const deposit = parseFloat(depositStr) || 0
            const withdrawal = parseFloat(withdrawalStr) || 0
            
            await prisma.workData.create({
              data: {
                employeeId: employee.id,
                month,
                casino: casino.toString().trim(),
                deposit,
                withdrawal,
                card: card?.toString().trim() || 'N/A'
              }
            })
            
            importedCount++
          }
          console.log(`Imported ${rows.length} records for ${nickname}`)
        } catch (sheetError: any) {
          console.log(`No data or error for ${nickname} in ${month}:`, sheetError.message)
        }
      } catch (folderError: any) {
        errorCount++
        const errorMsg = `Error processing ${folder.name}: ${folderError.message}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    // Импорт тестовых данных @sobroffice
    try {
      console.log('Importing test data for @sobroffice...')
      const testSpreadsheetId = '1i0IbJgxn7WwNH7T7VmOKz_xkH0GMfyGgpKKJqEmQqvA'
      const testRange = `${month}!A2:D100`
      
      const testData = await sheets.spreadsheets.values.get({
        spreadsheetId: testSpreadsheetId,
        range: testRange
      })

      let sobroffice = await prisma.employee.findUnique({
        where: { nickname: '@sobroffice' }
      })

      if (!sobroffice) {
        console.log('Creating @sobroffice employee')
        sobroffice = await prisma.employee.create({
          data: {
            nickname: '@sobroffice',
            role: 'TESTER',
            isActive: true
          }
        })
      }

      if (testData.data.values) {
        console.log(`Found ${testData.data.values.length} test records`)
        for (const row of testData.data.values) {
          const [casino, depositStr, withdrawalStr, card] = row
          
          if (!casino || casino === 'Unknown') continue
          
          await prisma.testResult.create({
            data: {
              employeeId: sobroffice.id,
              month,
              casino: casino.toString().trim(),
              deposit: parseFloat(depositStr) || 0,
              withdrawal: parseFloat(withdrawalStr) || 0,
              card: card?.toString().trim() || 'N/A'
            }
          })
          
          importedCount++
        }
      }
    } catch (testError: any) {
      console.log('Could not import test data:', testError.message)
      errors.push(`Test data error: ${testError.message}`)
    }

    // Создаем или обновляем запись MonthlyAccounting
    console.log('Updating monthly accounting...')
    await prisma.monthlyAccounting.upsert({
      where: { month },
      update: { gbpUsdRate: 1.27 },
      create: { month, gbpUsdRate: 1.27 }
    })

    const successMessage = `Импорт завершен! Импортировано ${importedCount} записей из ${employeeFolders.length} папок сотрудников.`
    console.log(successMessage)

    return NextResponse.json({
      success: true,
      data: {
        message: successMessage,
        imported: importedCount,
        errors: errorCount,
        errorMessages: errors.slice(0, 5)
      }
    })

  } catch (error: any) {
    console.error('Import error in POST /api/hr/import-sheets:', error)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown import error',
      needsAuth: error.message?.includes('auth') || error.message?.includes('token')
    })
  }
}
