import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' })

    // Ensure userId is treated as a number for SQL query if stored as int in DB
    // NextAuth often stores IDs as strings in the session
    const userId = parseInt(session.user.id)
    const userEmail = session.user.email

    if (isNaN(userId)) {
       return NextResponse.json({ error: 'Invalid User ID format' })
    }

    // Fetch Raw Rules
    const rules = await sql`
      SELECT * FROM access_rules 
      WHERE user_id = ${userId} AND is_active = true
    `

    // Fetch Documents with Mayan ID
    // Note: target_id in access_rules is VARCHAR, but documents.id is SERIAL (int)
    // We must cast documents.id to text for the join, OR access_rules.target_id to int
    // Based on schema: target_id is VARCHAR(255)
    const docs = await sql`
      SELECT d.id, d.title, d.mayan_document_id 
      FROM documents d
      JOIN access_rules ar ON ar.target_id = d.id::text AND ar.target_type = 'document'
      WHERE ar.user_id = ${userId} AND ar.is_active = true
    `

    // Fetch Folders
    const folders = await sql`
      SELECT ar.target_id, ar.target_name
      FROM access_rules ar
      WHERE ar.user_id = ${userId} AND ar.target_type = 'folder' AND ar.is_active = true
    `

    return NextResponse.json({
      user: { email: userEmail, role: session.user.role },
      stats: {
        active_rules: rules.length,
        accessible_docs: docs.length,
        accessible_folders: folders.length
      },
      details: {
        documents: docs,
        folders: folders
      },
      diagnosis: {
        has_mayan_ids: docs.every((d: any) => !!d.mayan_document_id),
        recommendation: docs.length === 0 ? "Aucun document trouvé. Vérifiez access_rules." : "Documents trouvés. Le problème est côté Mayan."
      }
    })

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
