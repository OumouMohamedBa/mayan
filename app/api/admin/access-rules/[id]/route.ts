import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getToken } from "next-auth/jwt"

// GET - Récupérer une règle d'accès par ID
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

    const ruleId = parseInt(id)

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
      WHERE ar.id = ${ruleId}
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Règle d'accès non trouvée" },
        { status: 404 }
      )
    }

    const rule = result[0]
    const now = new Date()
    const startDate = new Date(rule.start_date)
    const endDate = new Date(rule.end_date)
    
    let status = "active"
    if (!rule.is_active) {
      status = "disabled"
    } else if (now < startDate) {
      status = "upcoming"
    } else if (now > endDate) {
      status = "expired"
    }

    return NextResponse.json({
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
      status,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération de la règle d'accès:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT - Modifier une règle d'accès
export async function PUT(
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

    const ruleId = parseInt(id)
    const { userId, targetType, targetId, targetName, startDate, endDate, isActive } = await request.json()

    // Vérifier que la règle existe
    const existingRule = await sql`SELECT id FROM access_rules WHERE id = ${ruleId}`
    if (existingRule.length === 0) {
      return NextResponse.json(
        { error: "Règle d'accès non trouvée" },
        { status: 404 }
      )
    }

    // Construire la mise à jour
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (userId !== undefined) {
      updates.push(`user_id = $${paramIndex}`)
      values.push(parseInt(userId))
      paramIndex++
    }

    if (targetType !== undefined) {
      const validTargetTypes = ["document", "folder", "tag", "category"]
      if (!validTargetTypes.includes(targetType)) {
        return NextResponse.json(
          { error: "Type de cible invalide" },
          { status: 400 }
        )
      }
      updates.push(`target_type = $${paramIndex}`)
      values.push(targetType)
      paramIndex++
    }

    if (targetId !== undefined) {
      updates.push(`target_id = $${paramIndex}`)
      values.push(targetId)
      paramIndex++
    }

    if (targetName !== undefined) {
      updates.push(`target_name = $${paramIndex}`)
      values.push(targetName)
      paramIndex++
    }

    if (startDate !== undefined) {
      updates.push(`start_date = $${paramIndex}`)
      values.push(startDate)
      paramIndex++
    }

    if (endDate !== undefined) {
      updates.push(`end_date = $${paramIndex}`)
      values.push(endDate)
      paramIndex++
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`)
      values.push(isActive)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "Aucune modification fournie" },
        { status: 400 }
      )
    }

    updates.push("updated_at = CURRENT_TIMESTAMP")
    values.push(ruleId)

    const updateQuery = `
      UPDATE access_rules 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
    `

    await (sql as any).query(updateQuery, values)

    // Récupérer la règle mise à jour
    const updatedResult = await sql`
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
      WHERE ar.id = ${ruleId}
    `

    const rule = updatedResult[0]

    return NextResponse.json({
      message: "Règle d'accès mise à jour avec succès",
      rule: {
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
      }
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la règle d'accès:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PATCH - Activer/Désactiver une règle d'accès
export async function PATCH(
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

    const ruleId = parseInt(id)
    const { isActive } = await request.json()

    if (isActive === undefined) {
      return NextResponse.json(
        { error: "Le champ isActive est requis" },
        { status: 400 }
      )
    }

    await sql`
      UPDATE access_rules 
      SET is_active = ${isActive}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${ruleId}
    `

    return NextResponse.json({
      message: isActive ? "Règle d'accès activée" : "Règle d'accès désactivée",
      id: ruleId,
      isActive
    })
  } catch (error) {
    console.error("Erreur lors de la modification du statut:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une règle d'accès
export async function DELETE(
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

    const ruleId = parseInt(id)

    // Vérifier que la règle existe
    const existingRule = await sql`
      SELECT ar.id, ar.target_name, u.name as user_name 
      FROM access_rules ar
      JOIN users u ON ar.user_id = u.id
      WHERE ar.id = ${ruleId}
    `

    if (existingRule.length === 0) {
      return NextResponse.json(
        { error: "Règle d'accès non trouvée" },
        { status: 404 }
      )
    }

    await sql`DELETE FROM access_rules WHERE id = ${ruleId}`

    return NextResponse.json({
      message: "Règle d'accès supprimée avec succès",
      deletedRule: {
        id: existingRule[0].id,
        targetName: existingRule[0].target_name,
        userName: existingRule[0].user_name,
      }
    })
  } catch (error) {
    console.error("Erreur lors de la suppression de la règle d'accès:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
