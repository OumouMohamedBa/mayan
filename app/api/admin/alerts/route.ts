import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

interface Alert {
  id: string
  type: "expiring" | "disabled"
  message: string
  severity: "warning" | "error"
  time: string
}

export async function GET() {
  try {
    const alerts: Alert[] = []
    
    // Get expiring access rules (within 2 hours)
    const expiringAccess = await sql`
      SELECT 
        ta.id,
        u.name as user_name,
        u.email as user_email,
        ta.expires_at
      FROM temporary_access ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.expires_at > CURRENT_TIMESTAMP
      AND ta.expires_at <= CURRENT_TIMESTAMP + INTERVAL '2 hours'
    `
    
    // Add expiring access alerts
    expiringAccess.forEach(access => {
      const hoursUntilExpiry = Math.ceil(
        (new Date(access.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60)
      )
      
      alerts.push({
        id: `expiring-${access.id}`,
        type: "expiring",
        message: `${access.user_name}'s access expires in ${hoursUntilExpiry} hour${hoursUntilExpiry > 1 ? 's' : ''}`,
        severity: "warning",
        time: "Recently"
      })
    })

    // Get disabled users (you'd need to add an 'is_disabled' column to users table)
    // For now, we'll add a placeholder
    // const disabledUsers = await sql`
    //   SELECT name, email FROM users WHERE is_disabled = true
    // `
    
    // Placeholder for disabled users alert
    // disabledUsers.forEach(user => {
    //   alerts.push({
    //     id: `disabled-${user.email}`,
    //     type: "disabled",
    //     message: `User account '${user.email}' has been disabled`,
    //     severity: "error",
    //     time: "Recently"
    //   })
    // })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error("Error fetching alerts:", error)
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    )
  }
}
