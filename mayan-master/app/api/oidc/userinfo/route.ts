import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// OIDC UserInfo Endpoint
export async function GET(request: NextRequest) {
  try {
    // Check Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
    }

    // In a real implementation, validate the Access Token
    // For this mock, we assume if they have a token it's valid or check database
    // Since we don't store access tokens in DB for this demo, we'll fail gracefully 
    // or just return mock data if we could decode the user ID from the token.
    
    // However, usually UserInfo is fetched using the Access Token.
    // Since our access token is a mock string, we can't retrieve user info from it 
    // unless we encoded the user ID in it.
    
    // Let's assume the mock token contains the user ID for demo purposes
    // access_token format: "mock_access_token_UUID" -> can't really use it
    
    // For a proper implementation, we would need to store the access token or sign it too.
    
    return NextResponse.json({ 
      error: 'endpoint_not_implemented_in_demo' 
    }, { status: 501 })

  } catch (error) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}

// We allow POST as well per spec
export async function POST(request: NextRequest) {
  return GET(request)
}
