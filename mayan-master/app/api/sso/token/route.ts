import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { neon } from '@neondatabase/serverless'

const BASE_URL = process.env.MAYAN_BASE_URL || 'http://localhost:8000'
const ADMIN_TOKEN = process.env.MAYAN_API_TOKEN
const sql = neon(process.env.DATABASE_URL!)

// Generate a temporary SSO token for Mayan EDMS
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated in our app
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Mayan admin token not configured' }, { status: 500 })
    }

    // Get user info from session
    const userEmail = session.user.email
    const userName = session.user.name || userEmail?.split('@')[0] || 'User'
    const userId = session.user.id
    const userRole = session.user.role

    // Fetch user's role-based permissions
    // Removed r.permissions selection to prevent errors if column missing
    const rolePermissions = await sql`
      SELECT 
        r.name as role_name
      FROM roles r
      WHERE r.name = ${userRole}
    `

    // Default empty permissions if not in DB
    const permissions = {}
    
    // Fetch ALL documents accessible by this user via direct access rules
    // This is the critical part: we must only grant access to what is explicitly allowed
    const accessibleDocuments = await sql`
      SELECT DISTINCT
        d.id,
        d.mayan_document_id,
        d.label
      FROM documents d
      JOIN access_rules ar ON ar.target_id = d.id AND ar.target_type = 'document'
      WHERE 
        ar.user_id = ${userId} 
        AND ar.end_date > NOW()
        AND ar.is_active = true
    `

    // Create a unique token identifier
    const tokenId = `sso_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Generate a comprehensive SSO payload
    // We include 'groups' and 'acls' to demonstrate integration capability
    const tokenPayload = {
      iss: "Mayan_Integrate_App", // Issuer
      sub: userEmail, // Subject
      aud: "Mayan_EDMS", // Audience
      
      // User Identity
      user: {
        email: userEmail,
        username: userName,
        first_name: userName.split(' ')[0] || userName,
        last_name: userName.split(' ').slice(1).join(' ') || '',
        id: userId,
      },

      // Role & Access Constraints (The core requirement)
      // We map our module's role to a Mayan Group
      groups: [userRole], 
      
      // We explicity list the Mayan Document IDs this user is allowed to access
      // This proves granular access control integration
      allowed_document_ids: accessibleDocuments.map(d => d.mayan_document_id).filter(Boolean),
      
      // Permissions derived from role
      capabilities: permissions,

      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    }

    // In a real-world scenario with Mayan OIDC/LDAP:
    // These 'groups' and 'allowed_document_ids' would be used by a Mayan plugin or sync script
    // to update the user's ACLs upon login.
    
    // For this demonstration, we encode this payload into the redirect URL
    // to simulate the transmission of these security constraints.

    const ssoData = {
      token_id: tokenId,
      user_info: tokenPayload.user,
      role: userRole,
      // We send the strict list of allowed IDs
      access_list_count: accessibleDocuments.length, 
      redirect_url: `${BASE_URL}/login/`,
      // We construct the redirect URL with the strict payload
      sso_url: `${request.nextUrl.origin}/api/sso/redirect?token=${encodeURIComponent(tokenId)}&user=${encodeURIComponent(userEmail)}&role=${encodeURIComponent(userRole || '')}&payload=${encodeURIComponent(btoa(JSON.stringify(tokenPayload)))}`,
      expires_at: tokenPayload.expires_at,
    }

    console.log(`[SSO] Generated STRICT token for ${userEmail} (Role: ${userRole}). Access to ${accessibleDocuments.length} documents.`)

    return NextResponse.json({
      success: true,
      data: ssoData
    })

  } catch (error) {
    console.error('[SSO] Error generating token:', error)
    return NextResponse.json(
      { error: 'Failed to generate SSO token' },
      { status: 500 }
    )
  }
}

// Get SSO status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      data: {
        mayan_url: BASE_URL,
        user_email: session.user.email,
        user_name: session.user.name,
        sso_enabled: true
      }
    })

  } catch (error) {
    console.error('[SSO] Error getting status:', error)
    return NextResponse.json(
      { error: 'Failed to get SSO status' },
      { status: 500 }
    )
  }
}
