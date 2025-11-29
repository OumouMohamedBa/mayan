import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getToken } from "next-auth/jwt"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = await getToken({ req: request })
    
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const userId = parseInt(id)

    const accessList = await sql`
      SELECT 
        ta.id,
        ta.expires_at,
        ta.permissions,
        d.title as document_title
      FROM temporary_access ta
      JOIN documents d ON ta.document_id = d.id
      WHERE ta.user_id = ${userId}
      ORDER BY ta.expires_at DESC
    `

    const formattedAccess = accessList.map(access => {
      const now = new Date()
      const expiresAt = new Date(access.expires_at)
      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      let status = "Active"
      if (hoursUntilExpiry < 0) {
        status = "Expired"
      } else if (hoursUntilExpiry < 24) {
        status = "Expiring Soon"
      }

      return {
        id: access.id.toString(),
        document_title: access.document_title,
        permissions: access.permissions,
        expires_at: access.expires_at,
        status
      }
    })

    return NextResponse.json(formattedAccess)
  } catch (error) {
    console.error("Error fetching user access:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
