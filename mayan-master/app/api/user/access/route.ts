import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { getUserActiveAccessRules, getUserAccessibleTargets } from "@/lib/access-control"

// GET - Récupérer les accès de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const userId = parseInt(token.sub as string)
    
    // Récupérer les règles d'accès actives
    const activeRules = await getUserActiveAccessRules(userId)
    
    // Récupérer les cibles accessibles groupées par type
    const accessibleTargets = await getUserAccessibleTargets(userId)

    return NextResponse.json({
      rules: activeRules,
      accessible: accessibleTargets,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des accès:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
