import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(
        `${request.nextUrl.origin}/admin/data-management?error=auth_failed`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/admin/data-management?error=no_code`
      )
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/google/callback`
    )

    // Получаем токены
    const { tokens } = await oauth2Client.getToken(code)
    
    console.log('Received tokens:', {
      access_token: tokens.access_token ? 'present' : 'missing',
      refresh_token: tokens.refresh_token ? 'present' : 'missing',
      expiry_date: tokens.expiry_date
    })

    // Сохраняем токены в cookies (временное решение)
    // В продакшене лучше сохранять в базе данных
    const response = NextResponse.redirect(
      `${request.nextUrl.origin}/admin/data-management?auth=success`
    )

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 дней
      })
    }

    if (tokens.access_token) {
      response.cookies.set('google_access_token', tokens.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600
      })
    }

    return response

  } catch (error: any) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      `${request.nextUrl.origin}/admin/data-management?error=${encodeURIComponent(error.message)}`
    )
  }
}
