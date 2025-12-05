import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// OIDC Authorize Endpoint
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(request.url)
  
  const client_id = searchParams.get('client_id')
  const redirect_uri = searchParams.get('redirect_uri')
  const state = searchParams.get('state')
  const nonce = searchParams.get('nonce')
  const response_type = searchParams.get('response_type')

  // 1. Validate User Session
  if (!session?.user) {
    // If not logged in, redirect to app login with return URL
    const returnUrl = encodeURIComponent(request.url)
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${returnUrl}`, request.url))
  }

  // 2. Validate Client (Mayan)
  // In production, check against a list of registered clients
  if (client_id !== 'mayan-edms') { // Example Client ID
    // We'll be lenient for the demo and allow it, or you could error out
    console.log(`[OIDC] Warning: Unknown client_id ${client_id}`)
  }

  // 3. Generate Authorization Code
  // In a real OIDC provider, this code is stored in DB linked to the user & scope
  // Here we create a "stateless" code containing the user ID signed/encrypted
  // For demo simplicity, we just base64 encode some data (INSECURE for production)
  const codePayload = JSON.stringify({
    userId: session.user.id,
    email: session.user.email,
    nonce: nonce,
    timestamp: Date.now()
  })
  const code = Buffer.from(codePayload).toString('base64')

  // 4. Redirect back to Mayan with Code
  if (!redirect_uri) {
     return NextResponse.json({ error: 'Missing redirect_uri' }, { status: 400 })
  }

  const callbackUrl = new URL(redirect_uri)
  callbackUrl.searchParams.append('code', code)
  if (state) callbackUrl.searchParams.append('state', state)

  console.log(`[OIDC] Authorizing user ${session.user.email} for Mayan EDMS`)

  return NextResponse.redirect(callbackUrl)
}
