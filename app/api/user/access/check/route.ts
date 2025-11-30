import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { checkUserAccess, checkDocumentAccess } from "@/lib/access-control"

// POST - Vérifier si l'utilisateur a accès à une ressource
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    
    if (!token) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    const userId = parseInt(token.sub as string)
    const { targetType, targetId, documentMetadata } = await request.json()

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "targetType et targetId sont requis" },
        { status: 400 }
      )
    }

    let result

    // Si c'est un document et qu'on a des métadonnées, utiliser la vérification complète
    if (targetType === "document" && documentMetadata) {
      result = await checkDocumentAccess(userId, targetId, documentMetadata)
    } else {
      result = await checkUserAccess(userId, targetType, targetId)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Erreur lors de la vérification d'accès:", error)
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
