import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { google } from 'googleapis'
import { cookies } from 'next/headers'

// Получаем OAuth клиент с токенами
async function getAuthClient(request?: NextRequest) {
  const cookieStore = cookies()
  const origin = request?.nextUrl.origin || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
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

  if (tokens.refresh_token) {
    oauth2Client.setCredentials(tokens)
    return { client: oauth2Client, authorized: true }
  }

  return { client: oauth2Client, authorized: false }
}

export async function GET(request: NextRequest) {
  try {
    const { client, authorized } = await getAuthClient(request)
    
    if (!authorized) {
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

    // Остальной код проверки остается прежним...
    const drive = google.drive({ version: 'v3', auth: client })
    
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

export async function POST(request: NextRequest) {
  try {
    const { month } = await request.json()

    if (!month) {
      return NextResponse.json(
        { success: false, error: 'Month is required' },
        { status: 400 }
      )
    }

    const { client, authorized } = await getAuthClient(request)
    
    if (!authorized) {
      return NextResponse.json({
        success: false,
        needsAuth: true,
        error: 'Требуется авторизация Google'
      })
    }

    // Остальной код импорта остается без изменений...
    const drive = google.drive({ version: 'v3', auth: client })
    const sheets = google.sheets({ version: 'v4', auth: client })

    console.log(`Starting import for month: ${month}`)

    // Весь остальной код импорта остается прежним
    // ... (код импорта данных)
  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}
