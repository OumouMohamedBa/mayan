import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { checkUserAccess, checkDocumentAccess } from "./access-control"

type TargetType = "document" | "folder" | "tag" | "category"

interface AccessControlOptions {
  targetType: TargetType
  getTargetId: (request: NextRequest, params?: any) => string | Promise<string>
  getDocumentMetadata?: (request: NextRequest, params?: any) => Promise<{
    folderId?: string
    tagIds?: string[]
    categoryId?: string
  } | undefined>
}

/**
 * Wrapper pour protéger une route API avec vérification des règles d'accès
 */
export function withAccessControl(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  options: AccessControlOptions
) {
  return async (request: NextRequest, context: any) => {
    try {
      const token = await getToken({ req: request })

      if (!token) {
        return NextResponse.json(
          { error: "Non autorisé" },
          { status: 401 }
        )
      }

      const userId = parseInt(token.sub as string)
      const userRole = token.role as string

      // Les admins ont accès à tout
      if (userRole === "admin") {
        return handler(request, context)
      }

      // Récupérer l'ID de la cible
      const targetId = await options.getTargetId(request, context?.params)

      if (!targetId) {
        return NextResponse.json(
          { error: "ID de ressource manquant" },
          { status: 400 }
        )
      }

      let accessResult

      // Pour les documents, vérifier aussi les accès indirects
      if (options.targetType === "document" && options.getDocumentMetadata) {
        const metadata = await options.getDocumentMetadata(request, context?.params)
        accessResult = await checkDocumentAccess(userId, targetId, metadata)
      } else {
        accessResult = await checkUserAccess(userId, options.targetType, targetId)
      }

      if (!accessResult.hasAccess) {
        return NextResponse.json(
          { 
            error: "Accès refusé",
            reason: accessResult.reason || "Vous n'avez pas les droits d'accès à cette ressource"
          },
          { status: 403 }
        )
      }

      // L'utilisateur a accès, continuer avec le handler
      return handler(request, context)
    } catch (error) {
      console.error("Erreur dans withAccessControl:", error)
      return NextResponse.json(
        { error: "Erreur interne du serveur" },
        { status: 500 }
      )
    }
  }
}

/**
 * Vérifie l'accès et retourne le résultat sans bloquer
 * Utile pour les routes qui doivent gérer elles-mêmes la logique d'accès
 */
export async function verifyAccess(
  request: NextRequest,
  targetType: TargetType,
  targetId: string,
  documentMetadata?: {
    folderId?: string
    tagIds?: string[]
    categoryId?: string
  }
): Promise<{
  isAuthenticated: boolean
  isAdmin: boolean
  hasAccess: boolean
  userId?: number
  reason?: string
}> {
  try {
    const token = await getToken({ req: request })

    if (!token) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        hasAccess: false,
        reason: "Non authentifié",
      }
    }

    const userId = parseInt(token.sub as string)
    const userRole = token.role as string
    const isAdmin = userRole === "admin"

    // Les admins ont accès à tout
    if (isAdmin) {
      return {
        isAuthenticated: true,
        isAdmin: true,
        hasAccess: true,
        userId,
      }
    }

    // Vérifier l'accès
    let accessResult

    if (targetType === "document" && documentMetadata) {
      accessResult = await checkDocumentAccess(userId, targetId, documentMetadata)
    } else {
      accessResult = await checkUserAccess(userId, targetType, targetId)
    }

    return {
      isAuthenticated: true,
      isAdmin: false,
      hasAccess: accessResult.hasAccess,
      userId,
      reason: accessResult.reason,
    }
  } catch (error) {
    console.error("Erreur dans verifyAccess:", error)
    return {
      isAuthenticated: false,
      isAdmin: false,
      hasAccess: false,
      reason: "Erreur lors de la vérification",
    }
  }
}
