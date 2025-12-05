import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import crypto from 'crypto'

const sql = neon(process.env.DATABASE_URL!)

// Helper to sign JWT with HS256
function signJwt(payload: any, secret: string) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url')
  
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  const signature = crypto.createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url')
    
  return `${signatureInput}.${signature}`
}

// OIDC Token Endpoint
export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and Form Data (OIDC standard uses Form Data)
    let body: any = {};
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await request.json()
    } else {
      const formData = await request.formData()
      body = Object.fromEntries(formData.entries())
    }

    const { code, grant_type, redirect_uri } = body

    if (grant_type !== 'authorization_code') {
      return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 })
    }

    if (!code) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
    }

    // 1. Decode the "code" (which we fake-created in authorize endpoint)
    // In production, verify against DB and check expiration
    let codeData;
    try {
      codeData = JSON.parse(Buffer.from(code, 'base64').toString())
    } catch (e) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 })
    }

    const { userId, nonce } = codeData

    // 2. Fetch User Data
    // Note: We rely on role_name. Permissions are hardcoded/inferred here 
    // if they don't exist in the DB column to avoid 'errorMissingColumn'
    const userResult = await sql`
      SELECT u.*, r.name as role_name 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ${userId}
    `
    
    const user = userResult[0]
    if (!user) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 })
    }

    // Fetch Access Lists (Documents AND Folders)
    console.log(`[OIDC Debug] Fetching rules for user ID: ${userId}`)
    
    // 1. Direct Document Access
    // Fix: Cast d.id to text to match access_rules.target_id (VARCHAR)
    const accessibleDocuments = await sql`
      SELECT DISTINCT d.mayan_document_id
      FROM documents d
      JOIN access_rules ar ON ar.target_id = d.id::text AND ar.target_type = 'document'
      WHERE 
        ar.user_id = ${userId} 
        AND ar.end_date > NOW()
        AND ar.is_active = true
    `
    
    // 2. Folder Access (We send the folder IDs to Mayan, letting Mayan handle the hierarchy)
    const accessibleFolders = await sql`
      SELECT DISTINCT ar.target_id
      FROM access_rules ar
      WHERE 
        ar.user_id = ${userId} 
        AND ar.target_type = 'folder'
        AND ar.end_date > NOW()
        AND ar.is_active = true
    `
    
    const documentIds = accessibleDocuments.map(d => d.mayan_document_id).filter(Boolean)
    const folderIds = accessibleFolders.map(f => f.target_id).filter(Boolean)
    
    console.log(`[OIDC Debug] User ${user.email} access: ${documentIds.length} docs, ${folderIds.length} folders`)

    // 3. Generate ID Token (JWT)
    const now = Math.floor(Date.now() / 1000)
    
    // Determine Access Scope
    const isGlobalAdmin = user.role_name?.toLowerCase() === 'admin' || user.role_name?.toLowerCase() === 'administrator';
    const accessScope = isGlobalAdmin ? 'global' : 'restricted';

    // FORCE A RESTRICTED GROUP NAME if not admin
    const targetGroup = isGlobalAdmin ? 'Administrators' : 'SSO_Restricted_Access';

    const idTokenPayload = {
      iss: request.nextUrl.origin,
      sub: user.id.toString(),
      aud: "mayan-edms", 
      exp: now + 3600, 
      iat: now,
      nonce: nonce,
      
      // Standard OIDC Claims
      email: user.email,
      name: user.name,
      preferred_username: user.name,
      
      // Groups for Mayan Mapping
      groups: [targetGroup], 
      
      // CUSTOM CLAIMS FOR MAYAN SECURITY
      mayan_access_scope: accessScope,
      mayan_document_access_list: isGlobalAdmin ? [] : documentIds,
      mayan_folder_access_list: isGlobalAdmin ? [] : folderIds
    }

    // Sign with a secret (In production this should be NEXTAUTH_SECRET or dedicated OIDC secret)
    const secret = process.env.NEXTAUTH_SECRET || 'development_secret_key_change_me'
    const id_token = signJwt(idTokenPayload, secret)

    // 4. Return Token Response
    console.log(`[OIDC] Issued token for ${user.email} (Role: ${user.role_name}). Access to ${documentIds.length} docs.`)

    return NextResponse.json({
      access_token: "mock_access_token_" + crypto.randomUUID(), // Access token not used in this flow but required
      token_type: "Bearer",
      expires_in: 3600,
      id_token: id_token,
    })

  } catch (error) {
    console.error('[OIDC] Token Error:', error)
    return NextResponse.json({ error: 'server_error' }, { status: 500 })
  }
}
