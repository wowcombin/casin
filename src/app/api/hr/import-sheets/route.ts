import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { google } from 'googleapis'

// Конфигурация OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
)

// Проверка авторизации
async function checkAuth() {
  try {
    // Проверяем, есть ли сохраненные токены
    const tokens = process.env.GOOGLE_REFRESH_TOKEN ? {
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      access_token: process.env.GOOGLE_ACCESS_TOKEN
    } : null

    if (!tokens || !tokens.refresh_token) {
      return {
        authorized: false,
        message: 'Требуется авторизация Google Drive'
      }
    }

    oauth2Client.setCredentials(tokens)
    
    // Проверяем, работает ли токен
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    await drive.files.list({ pageSize: 1 })
    
    return { authorized: true }
  } catch (error) {
    console.error('Auth check error:', error)
    return {
      authorized: false,
      message: 'Токен недействителен, требуется повторная авторизация'
    }
  }
}

export async function GET() {
  try {
    const authCheck = await checkAuth()
    
    if (!authCheck.authorized) {
      return NextResponse.json({
        success: false,
        needsAuth: true,
        data: {
          status: 'not_authenticated',
          message: authCheck.message,
          authUrl: `/api/auth/google`
        }
      })
    }

    // Если авторизованы, показываем информацию о доступе
    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    
    try {
      // Пытаемся получить информацию о папке Junior
      const juniorFolderId = '1FEtrBtiv5ZpxV4C9paFzKf8aQuNdwRdu'
      const folderResponse = await drive.files.get({
        fileId: juniorFolderId,
        fields: 'name, id'
      })

      // Получаем список папок сотрудников
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
          employees: employees.slice(0, 5), // Первые 5 для примера
          message: 'Google Drive подключен успешно'
        }
      })
    } catch (error: any) {
      console.error('Drive access error:', error)
      return NextResponse.json({
        success: false,
        data: {
          status: 'authenticated',
          message: 'Авторизован, но нет доступа к папке. Проверьте права доступа.',
          error: error.message
        }
      })
    }

  } catch (error: any) {
    console.error('Error checking Google auth:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      data: {
        status: 'error',
        message: 'Ошибка проверки авторизации'
      }
    })
  }
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

    // Проверяем авторизацию
    const authCheck = await checkAuth()
    if (!authCheck.authorized) {
      return NextResponse.json({
        success: false,
        needsAuth: true,
        error: authCheck.message
      })
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client })
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client })

    console.log(`Starting import for month: ${month}`)

    // ID папки Junior
    const juniorFolderId = '1FEtrBtiv5ZpxV4C9paFzKf8aQuNdwRdu'
    
    // Получаем список папок сотрудников
    const foldersResponse = await drive.files.list({
      q: `'${juniorFolderId}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
      pageSize: 100
    })

    const employeeFolders = foldersResponse.data.files || []
    console.log(`Found ${employeeFolders.length} employee folders`)

    let importedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Удаляем старые данные за этот месяц
    await prisma.workData.deleteMany({ where: { month } })
    await prisma.testResult.deleteMany({ where: { month } })

    // Обрабатываем каждую папку сотрудника
    for (const folder of employeeFolders) {
      try {
        const folderName = folder.name || ''
        const nickname = folderName.replace('WORK ', '').trim()
        
        if (!nickname.startsWith('@')) {
          continue
        }

        console.log(`Processing employee: ${nickname}`)

        // Создаем или находим сотрудника
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

        // Ищем файл WORK @username в папке
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

        // Читаем данные из листа месяца
        const range = `${month}!A2:D100` // A-Casino, B-Deposit, C-Withdrawal, D-Card
        
        try {
          const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId: workFile.id!,
            range: range
          })

          const rows = sheetData.data.values || []
          
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
        } catch (sheetError: any) {
          console.log(`No data for ${nickname} in ${month}: ${sheetError.message}`)
        }
      } catch (folderError: any) {
        errorCount++
        errors.push(`Error processing ${folder.name}: ${folderError.message}`)
        console.error(`Error processing folder ${folder.name}:`, folderError)
      }
    }

    // Импорт тестовых данных @sobroffice
    try {
      const testSpreadsheetId = '1i0IbJgxn7WwNH7T7VmOKz_xkH0GMfyGgpKKJqEmQqvA'
      const testRange = `${month}!A2:D100`
      
      const testData = await sheets.spreadsheets.values.get({
        spreadsheetId: testSpreadsheetId,
        range: testRange
      })

      const sobroffice = await prisma.employee.findUnique({
        where: { nickname: '@sobroffice' }
      })

      if (sobroffice && testData.data.values) {
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
    }

    // Создаем или обновляем запись MonthlyAccounting
    await prisma.monthlyAccounting.upsert({
      where: { month },
      update: { gbpUsdRate: 1.27 },
      create: { month, gbpUsdRate: 1.27 }
    })

    return NextResponse.json({
      success: true,
      data: {
        message: `Импорт завершен! Импортировано ${importedCount} записей из ${employeeFolders.length} папок сотрудников.`,
        imported: importedCount,
        errors: errorCount,
        errorMessages: errors.slice(0, 5) // Первые 5 ошибок
      }
    })

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      needsAuth: error.message.includes('auth') || error.message.includes('token')
    })
  }
}
