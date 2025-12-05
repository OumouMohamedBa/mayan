import { NextRequest, NextResponse } from 'next/server'

// OIDC Discovery Endpoint
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  
  // Ensure we don't have trailing slashes which might confuse exact string matching
  const issuer = origin.replace(/\/$/, '')

  return NextResponse.json({
    issuer: issuer,
    authorization_endpoint: `${origin}/api/oidc/authorize`,
    token_endpoint: `${origin}/api/oidc/token`,
    userinfo_endpoint: `${origin}/api/oidc/userinfo`,
    jwks_uri: `${origin}/api/oidc/jwks`,
    response_types_supported: ["code", "id_token", "token id_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["HS256"], // Using HS256 for simplicity in this demo
    scopes_supported: ["openid", "profile", "email", "groups", "permissions"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    claims_supported: [
      "sub",
      "iss",
      "aud",
      "exp",
      "iat",
      "email",
      "name",
      "given_name",
      "family_name",
      "groups",
      "mayan_document_access_list" // Custom claim for granular access
    ]
  })
}
