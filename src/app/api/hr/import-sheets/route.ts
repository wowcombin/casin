import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { google } from 'googleapis'

// Initialize Google APIs with OAuth tokens
function getGoogleAuth(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: accessToken
  })

  return oauth2Client
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

    // Get access token from cookies
    const accessToken = request.cookies.get('google_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Google authentication required',
        needsAuth: true,
        authUrl: '/api/auth/google'
      })
    }

    console.log(`Starting Google Drive import for month: ${month}`)

    const auth = getGoogleAuth(accessToken)
    const drive = google.drive({ version: 'v3', auth })
    const sheets = google.sheets({ version: 'v4', auth })

    // Get current GBP/USD rate
    const rate = await getCurrentExchangeRate()

    // Import from Google Drive
    const importResult = await importFromGoogleDrive(drive, sheets, month, rate)

    // Process and save to database
    const processedData = await processAndSaveData(importResult, month)

    return NextResponse.json({
      success: true,
      data: {
        month,
        rate,
        ...processedData,
        message: `✅ Импорт завершен для ${month}!\n\nОбработано: ${processedData.totalProcessed} записей\nРабота: ${processedData.workDataCount} записей\nТесты: ${processedData.testDataCount} записей\nСотрудники: ${processedData.employees.length}`
      }
    })

  } catch (error) {
    console.error('Error importing from Google Drive:', error)
    
    if (error.message?.includes('invalid_grant') || error.message?.includes('unauthorized')) {
      return NextResponse.json({
        success: false,
        error: 'Google authentication expired. Please re-authenticate.',
        needsAuth: true,
        authUrl: '/api/auth/google'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Import failed: ' + error.message },
      { status: 500 }
    )
  }
}

// ... остальные функции остаются без изменений

// GET endpoint to check auth status
export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('google_access_token')?.value
    const hasCredentials = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
    
    if (!hasCredentials) {
      return NextResponse.json({
        success: false,
        data: {
          status: 'not_configured',
          message: 'Google OAuth не настроен'
        }
      })
    }

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        data: {
          status: 'not_authenticated',
          message: 'Требуется авторизация Google',
          authUrl: '/api/auth/google'
        }
      })
    }

    // Test API access
    try {
      const auth = getGoogleAuth(accessToken)
      const drive = google.drive({ version: 'v3', auth })
      
      await drive.files.get({ fileId: process.env.GOOGLE_JUNIOR_FOLDER_ID! })
      
      return NextResponse.json({
        success: true,
        data: {
          status: 'authenticated',
          message: 'Google Drive доступ настроен и готов к работе'
        }
      })
    } catch (apiError) {
      return NextResponse.json({
        success: false,
        data: {
          status: 'access_denied',
          message: 'Нет доступа к Google Drive папке',
          needsAuth: true,
          authUrl: '/api/auth/google'
        }
      })
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}
