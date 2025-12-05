import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.MAYAN_BASE_URL || 'http://localhost:8000'

// Handle SSO redirect to Mayan EDMS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const userEmail = searchParams.get('user')
    const payload = searchParams.get('payload')
    // const userName = searchParams.get('name') // Extracted from payload if available
    // const userRole = searchParams.get('role') // Extracted from payload if available

    if (!token || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required SSO parameters' },
        { status: 400 }
      )
    }

    let decodedPayload: any = {};
    if (payload) {
      try {
        decodedPayload = JSON.parse(atob(payload));
      } catch (e) {
        console.error("Failed to decode SSO payload", e);
      }
    }

    const userName = decodedPayload?.user?.username || searchParams.get('name') || '';
    const userRole = decodedPayload?.groups?.[0] || searchParams.get('role') || '';

    // STRICT SECURITY ENFORCEMENT SIMULATION
    // We log the exact constraints being passed to Mayan
    console.log(`[SSO Security] Enforcing Role: ${userRole}`);
    console.log(`[SSO Security] Whitelisted Documents: ${decodedPayload?.allowed_document_ids?.length || 0}`);

    // In a production environment with Mayan EDMS:
    // We would use a signed JWT (JWE) for the payload to prevent tampering.
    // Mayan would receive this token, validate the signature, and then:
    // 1. Create/Update the user.
    // 2. Sync group memberships (add user to 'userRole' group).
    // 3. (Optional) Update ACLs based on 'allowed_document_ids'.
    
    // Construct the Mayan Login URL
    // We pass the strict context via the 'sso_token' parameter which a custom Mayan plugin could consume.
    const contextData = payload || btoa(JSON.stringify({
      token,
      user: userEmail,
      role: userRole,
      timestamp: Date.now()
    }));

    const mayanLoginUrl = `${BASE_URL}/login/?`
      + `next=${encodeURIComponent('/dashboard/')}`
      + `&username=${encodeURIComponent(userEmail)}`
      + (userName ? `&display_name=${encodeURIComponent(userName)}` : '')
      // We explicitly pass the role as a parameter for immediate visibility/logging on Mayan side if configured
      + (userRole ? `&group=${encodeURIComponent(userRole)}` : '') 
      + `&sso_token=${encodeURIComponent(contextData)}`

    console.log(`[SSO Redirect] Redirecting user ${userEmail} to Mayan EDMS.`)

    // Redirect to Mayan EDMS
    return NextResponse.redirect(mayanLoginUrl)

  } catch (error) {
    console.error('[SSO Redirect] Error:', error)
    return NextResponse.json(
      { error: 'SSO redirect failed' },
      { status: 500 }
    )
  }
}

// Handle SSO POST request (alternative flow)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, userName, tokenId } = body

    if (!userEmail || !tokenId) {
      return NextResponse.json(
        { error: 'Missing required SSO parameters' },
        { status: 400 }
      )
    }

    // Create a more sophisticated SSO flow
    // This would integrate with Mayan's authentication system
    
    const ssoResponse = {
      success: true,
      redirect_url: `${BASE_URL}/sso/complete/?token=${tokenId}&user=${encodeURIComponent(userEmail)}`,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    }

    return NextResponse.json(ssoResponse)

  } catch (error) {
    console.error('[SSO POST] Error:', error)
    return NextResponse.json(
      { error: 'SSO request failed' },
      { status: 500 }
    )
  }
}
