import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getToken } from "next-auth/jwt"

// GET - Liste des règles d'accès
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    const targetType = searchParams.get("targetType")

    // Récupérer toutes les règles d'accès
    const result = await sql`
      SELECT 
        ar.id,
        ar.user_id,
        ar.target_type,
        ar.target_id,
        ar.target_name,
        ar.start_date,
        ar.end_date,
        ar.is_active,
        ar.created_at,
        ar.updated_at,
        u.name as user_name,
        u.email as user_email
      FROM access_rules ar
      JOIN users u ON ar.user_id = u.id
      ORDER BY ar.created_at DESC
    `

    const now = new Date()
    const formattedRules = result
      .filter((rule: any) => {
        // Filtrer par userId si fourni
        if (userId && rule.user_id.toString() !== userId) {
          return false
        }
        // Filtrer par targetType si fourni
        if (targetType && rule.target_type !== targetType) {
          return false
        }
        return true
      })
      .map((rule: any) => {
        const startDate = new Date(rule.start_date)
        const endDate = new Date(rule.end_date)
        
        let computedStatus = "active"
        if (!rule.is_active) {
          computedStatus = "disabled"
        } else if (now < startDate) {
          computedStatus = "upcoming"
        } else if (now > endDate) {
          computedStatus = "expired"
        }

        return {
          id: rule.id.toString(),
          userId: rule.user_id.toString(),
          userName: rule.user_name,
          userEmail: rule.user_email,
          targetType: rule.target_type,
          targetId: rule.target_id,
          targetName: rule.target_name,
          startDate: rule.start_date,
          endDate: rule.end_date,
          isActive: rule.is_active,
          status: computedStatus,
          createdAt: rule.created_at,
          updatedAt: rule.updated_at,
        }
      })
      .filter((rule: any) => {
        // Filtrer par status si fourni
        if (status && rule.status !== status) {
          return false
        }
        return true
      })

    return NextResponse.json(formattedRules)
  } catch (error) {
    console.error("Erreur lors de la récupération des règles d'accès:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer une règle d'accès
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const { userId, targetType, targetId, targetName, startDate, endDate, isActive } = await request.json()

    // Validation
    if (!userId || !targetType || !targetId || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      )
    }

    const validTargetTypes = ["document", "folder", "tag", "category"]
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: "Type de cible invalide" },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    const userCheck = await sql`SELECT id, name FROM users WHERE id = ${parseInt(userId)}`
    if (userCheck.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Créer la règle d'accès
    const result = await sql`
      INSERT INTO access_rules (user_id, target_type, target_id, target_name, start_date, end_date, is_active)
      VALUES (${parseInt(userId)}, ${targetType}, ${targetId}, ${targetName || targetId}, ${startDate}, ${endDate}, ${isActive !== false})
      RETURNING id, user_id, target_type, target_id, target_name, start_date, end_date, is_active, created_at
    `

    const newRule = result[0]

    return NextResponse.json({
      id: newRule.id.toString(),
      userId: newRule.user_id.toString(),
      userName: userCheck[0].name,
      targetType: newRule.target_type,
      targetId: newRule.target_id,
      targetName: newRule.target_name,
      startDate: newRule.start_date,
      endDate: newRule.end_date,
      isActive: newRule.is_active,
      createdAt: newRule.created_at,
    }, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la création de la règle d'accès:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
