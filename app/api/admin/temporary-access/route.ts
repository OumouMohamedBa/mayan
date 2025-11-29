import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Get active and expiring temporary access rules
    const temporaryAccess = await sql`
      SELECT 
        ta.id,
        ta.expires_at,
        ta.permissions,
        u.name as user_name,
        u.email as user_email,
        d.title as document_title
      FROM temporary_access ta
      JOIN users u ON ta.user_id = u.id
      JOIN documents d ON ta.document_id = d.id
      WHERE ta.expires_at > CURRENT_TIMESTAMP
      ORDER BY ta.expires_at ASC
      LIMIT 10
    `

    // Format the response
    const formattedAccess = temporaryAccess.map(access => {
      const now = new Date()
      const expiresAt = new Date(access.expires_at)
      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      let status = "Active"
      if (hoursUntilExpiry < 2) {
        status = "Expiring Soon"
      }
      
      // Extract access type from permissions JSON
      const permissions = Array.isArray(access.permissions) ? access.permissions : []
      const accessType = permissions.length > 0 
        ? permissions[0].action === "read" ? "Read-Only Access" 
        : permissions[0].action === "write" ? "Document Access"
        : "Full Access"
        : "Unknown Access"

      return {
        id: access.id.toString(),
        userName: access.user_name,
        userEmail: access.user_email,
        accessType,
        start: "N/A", // We don't track start time in current schema
        end: new Date(access.expires_at).toLocaleString(),
        status
      }
    })

    return NextResponse.json(formattedAccess)
  } catch (error) {
    console.error("Error fetching temporary access:", error)
    return NextResponse.json(
      { error: "Failed to fetch temporary access data" },
      { status: 500 }
    )
  }
}
