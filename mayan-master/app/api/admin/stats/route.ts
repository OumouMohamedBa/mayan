import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // Get total users by role
    const userStats = await sql`
      SELECT 
        r.name as role,
        COUNT(u.id) as count
      FROM users u
      JOIN roles r ON u.role_id = r.id
      GROUP BY r.name
    `
    
    // Get total users
    const totalUsersResult = await sql`SELECT COUNT(*) as count FROM users`
    const totalUsers = totalUsersResult[0].count

    // Get active temporary access rules
    const activeAccessResult = await sql`
      SELECT COUNT(*) as count 
      FROM temporary_access 
      WHERE expires_at > CURRENT_TIMESTAMP
    `
    const activeAccessRules = activeAccessResult[0].count

    // Get logins in last 24 hours (this would require a login tracking table)
    // For now, we'll use a placeholder
    const logins24h = 0

    // Format stats
    const stats = {
      totalUsers,
      admins: userStats.find(s => s.role === 'admin')?.count || 0,
      contributors: userStats.find(s => s.role === 'contributor')?.count || 0,
      readers: userStats.find(s => s.role === 'reader')?.count || 0,
      activeAccessRules,
      logins24h
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    )
  }
}
