import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    const baseUrl = "https://casin.vercel.app"

    if (error) {
      return NextResponse.redirect(`${baseUrl}/admin/dashboard?auth_error=${error}`)
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/admin/dashboard?auth_error=no_code`)
    }

    console.log('Exchanging OAuth code for tokens...')

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${baseUrl}/api/auth/google/callback`
      })
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return NextResponse.redirect(`${baseUrl}/admin/dashboard?auth_error=token_exchange_failed`)
    }

    const tokens = await tokenResponse.json()
    console.log('OAuth tokens received successfully')

    // Store tokens
    const response = NextResponse.redirect(`${baseUrl}/admin/dashboard?auth_success=true`)
    
    response.cookies.set('google_access_token', tokens.access_token, {
      httpOnly: true,
      secure: true,
      maxAge: tokens.expires_in || 3600,
      sameSite: 'lax'
    })

    if (tokens.refresh_token) {
      response.cookies.set('google_refresh_token', tokens.refresh_token, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax'
      })
    }

    return response

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(`https://casin.vercel.app/admin/dashboard?auth_error=callback_failed`)
  }
}
