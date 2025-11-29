import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getToken } from "next-auth/jwt"
import bcrypt from "bcryptjs"

// GET - Récupérer un utilisateur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const userId = parseInt(id)

    // Vérifier les permissions (admin ou propriétaire)
    if (token.role !== "admin" && token.sub !== id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      )
    }

    const user = await sql`
      SELECT u.id, u.name, u.email, u.created_at, u.updated_at, r.name as role, u.status
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${userId}
    `

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(user[0])
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PUT - Modifier un utilisateur (pour la page de gestion admin)
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

    const userId = parseInt(id)
    const { name, email, password, role, status } = await request.json()

    // Vérifier si l'utilisateur existe
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const emailCheck = await sql`
        SELECT id FROM users WHERE email = ${email} AND id != ${userId}
      `
      if (emailCheck.length > 0) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé" },
          { status: 400 }
        )
      }
    }

    // Obtenir le role_id si le rôle est fourni
    let roleId = null
    if (role) {
      const roleResult = await sql`SELECT id FROM roles WHERE name = ${role}`
      if (roleResult.length === 0) {
        return NextResponse.json(
          { error: "Rôle invalide" },
          { status: 400 }
        )
      }
      roleId = roleResult[0].id
    }

    // Construire la mise à jour dynamique avec des paramètres
    let updateParts = []
    let updateValues = []
    let paramIndex = 1
    
    if (name) {
      updateParts.push(`name = $${paramIndex}`)
      updateValues.push(name)
      paramIndex++
    }
    
    if (email) {
      updateParts.push(`email = $${paramIndex}`)
      updateValues.push(email)
      paramIndex++
    }
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      updateParts.push(`password = $${paramIndex}`)
      updateValues.push(hashedPassword)
      paramIndex++
    }
    
    if (roleId) {
      updateParts.push(`role_id = $${paramIndex}`)
      updateValues.push(roleId)
      paramIndex++
    }

    if (updateParts.length > 0) {
      // Ajouter l'ID comme dernier paramètre
      updateValues.push(userId)
      
      const updateQuery = `
        UPDATE users 
        SET ${updateParts.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramIndex}
      `
      
      await (sql as any).query(updateQuery, updateValues)
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await sql`
      SELECT u.id, u.name, u.email, u.created_at, u.updated_at, r.name as role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ${userId}
    `

    return NextResponse.json({
      message: "Utilisateur mis à jour avec succès",
      user: updatedUser[0]
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// PATCH - Modifier le statut d'un utilisateur
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

    const userId = parseInt(id)
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json(
        { error: "Statut manquant" },
        { status: 400 }
      )
    }

    // Mettre à jour le statut en base de données
    await sql`
      UPDATE users 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${userId}
    `
    
    return NextResponse.json({
      message: "Statut de l'utilisateur mis à jour avec succès",
      id: userId,
      status
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const userId = parseInt(id)

    // Seul l'admin peut supprimer des utilisateurs (sauf son propre compte)
    if (token.role !== "admin") {
      return NextResponse.json(
        { error: "Accès refusé - Admin requis" },
        { status: 403 }
      )
    }

    // Empêcher l'admin de se supprimer lui-même
    if (token.sub === id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      )
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await sql`
      SELECT id, name, email FROM users WHERE id = ${userId}
    `

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Supprimer l'utilisateur
    await sql`DELETE FROM users WHERE id = ${userId}`

    return NextResponse.json({
      message: "Utilisateur supprimé avec succès",
      deletedUser: {
        id: existingUser[0].id,
        name: existingUser[0].name,
        email: existingUser[0].email,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la suppression de l'utilisateur:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
