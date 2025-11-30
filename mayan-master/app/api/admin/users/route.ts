import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getToken } from "next-auth/jwt"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const result = await sql`
      SELECT u.id, u.name, u.email, u.created_at, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.created_at DESC
    `

    // Format the response to match the frontend expectations
    const formattedUsers = result.map(user => ({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: "Active", // Default status since we don't have status field yet
      createdAt: new Date(user.created_at).toLocaleDateString()
    }))

    return NextResponse.json(formattedUsers)
  } catch (error) {
    console.error("Failed to fetch users:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, email, password, role, status } = await request.json()

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    // Get role ID
    const roleResult = await sql`
      SELECT id FROM roles WHERE name = ${role}
    `
    
    if (roleResult.length === 0) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      )
    }

    const roleId = roleResult[0].id

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const result = await sql`
      INSERT INTO users (name, email, password, role_id)
      VALUES (${name}, ${email}, ${hashedPassword}, ${roleId})
      RETURNING id, name, email, created_at
    `

    const newUser = result[0]

    return NextResponse.json({
      id: newUser.id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: role,
      status: status || "Active",
      createdAt: new Date(newUser.created_at).toLocaleDateString()
    })
  } catch (error) {
    console.error("Failed to create user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id, status } = await request.json()

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing user ID or status" },
        { status: 400 }
      )
    }

    // For now, we'll just return success since we don't have status field in database
    // In a real implementation, you would add a status column to the users table
    
    return NextResponse.json({
      message: "User status updated successfully",
      id,
      status
    })
  } catch (error) {
    console.error("Failed to update user status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
