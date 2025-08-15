import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/dashboard?auth_error=${error}`)
    }

    if (!code) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/dashboard?auth_error=no_code`)
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/dashboard?auth_error=token_exchange_failed`)
    }

    const tokens = await tokenResponse.json()

    // Store tokens (in production, save to database securely)
    // For now, we'll set them as secure cookies or session storage
    const response = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/dashboard?auth_success=true`)
    
    // Set secure cookies with tokens (httpOnly for security)
    response.cookies.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: true,
      maxAge: tokens.expires_in || 3600
    })

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 30 // 30 days
      })
    }

    return response

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/dashboard?auth_error=callback_failed`)
  }
}
