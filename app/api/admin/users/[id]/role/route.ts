import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getToken } from "next-auth/jwt"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = await getToken({ req: request })
    
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { role } = await request.json()
    const userId = parseInt(id)

    if (!role || !["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    // Get role ID
    const roleResult = await sql`
      SELECT id FROM roles WHERE name = ${role}
    `

    if (roleResult.length === 0) {
      return NextResponse.json(
        { error: "Role not found" },
        { status: 404 }
      )
    }

    const roleId = roleResult[0].id

    // Update user role
    await sql`
      UPDATE users 
      SET role_id = ${roleId}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${userId}
    `

    return NextResponse.json({ message: "User role updated successfully" })
  } catch (error) {
    console.error("Failed to update user role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
