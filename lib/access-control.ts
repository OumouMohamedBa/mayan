import { sql } from "@/lib/db"

export interface AccessCheckResult {
  hasAccess: boolean
  reason?: string
  rule?: {
    id: string
    targetType: string
    targetName: string
    startDate: Date
    endDate: Date
  }
}

/**
 * Vérifie si un utilisateur a accès à une ressource selon les règles d'accès temporaires
 */
export async function checkUserAccess(
  userId: number,
  targetType: "document" | "folder" | "tag" | "category",
  targetId: string
): Promise<AccessCheckResult> {
  try {
    const now = new Date()

    // Chercher une règle d'accès active pour cet utilisateur et cette cible
    const rules = await sql`
      SELECT 
        id,
        target_type,
        target_id,
        target_name,
        start_date,
        end_date,
        is_active
      FROM access_rules
      WHERE user_id = ${userId}
        AND target_type = ${targetType}
        AND target_id = ${targetId}
        AND is_active = true
        AND start_date <= ${now.toISOString()}
        AND end_date >= ${now.toISOString()}
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (rules.length > 0) {
      const rule = rules[0]
      return {
        hasAccess: true,
        rule: {
          id: rule.id.toString(),
          targetType: rule.target_type,
          targetName: rule.target_name,
          startDate: new Date(rule.start_date),
          endDate: new Date(rule.end_date),
        },
      }
    }

    return {
      hasAccess: false,
      reason: "Aucune règle d'accès valide trouvée",
    }
  } catch (error) {
    console.error("Erreur lors de la vérification d'accès:", error)
    return {
      hasAccess: false,
      reason: "Erreur lors de la vérification d'accès",
    }
  }
}

/**
 * Vérifie si un utilisateur a accès à un document (vérifie aussi le dossier, tag et catégorie)
 */
export async function checkDocumentAccess(
  userId: number,
  documentId: string,
  documentMetadata?: {
    folderId?: string
    tagIds?: string[]
    categoryId?: string
  }
): Promise<AccessCheckResult> {
  // 1. Vérifier l'accès direct au document
  const documentAccess = await checkUserAccess(userId, "document", documentId)
  if (documentAccess.hasAccess) {
    return documentAccess
  }

  // 2. Si des métadonnées sont fournies, vérifier les accès indirects
  if (documentMetadata) {
    // Vérifier l'accès via le dossier
    if (documentMetadata.folderId) {
      const folderAccess = await checkUserAccess(userId, "folder", documentMetadata.folderId)
      if (folderAccess.hasAccess) {
        return folderAccess
      }
    }

    // Vérifier l'accès via les tags
    if (documentMetadata.tagIds && documentMetadata.tagIds.length > 0) {
      for (const tagId of documentMetadata.tagIds) {
        const tagAccess = await checkUserAccess(userId, "tag", tagId)
        if (tagAccess.hasAccess) {
          return tagAccess
        }
      }
    }

    // Vérifier l'accès via la catégorie
    if (documentMetadata.categoryId) {
      const categoryAccess = await checkUserAccess(userId, "category", documentMetadata.categoryId)
      if (categoryAccess.hasAccess) {
        return categoryAccess
      }
    }
  }

  return {
    hasAccess: false,
    reason: "Aucun accès autorisé pour ce document",
  }
}

/**
 * Récupère toutes les règles d'accès actives pour un utilisateur
 */
export async function getUserActiveAccessRules(userId: number) {
  try {
    const now = new Date()

    const rules = await sql`
      SELECT 
        id,
        target_type,
        target_id,
        target_name,
        start_date,
        end_date
      FROM access_rules
      WHERE user_id = ${userId}
        AND is_active = true
        AND start_date <= ${now.toISOString()}
        AND end_date >= ${now.toISOString()}
      ORDER BY target_type, target_name
    `

    return rules.map((rule: any) => ({
      id: rule.id.toString(),
      targetType: rule.target_type,
      targetId: rule.target_id,
      targetName: rule.target_name,
      startDate: rule.start_date,
      endDate: rule.end_date,
    }))
  } catch (error) {
    console.error("Erreur lors de la récupération des règles d'accès:", error)
    return []
  }
}

/**
 * Récupère tous les IDs de documents/dossiers/tags/catégories auxquels l'utilisateur a accès
 */
export async function getUserAccessibleTargets(userId: number) {
  try {
    const now = new Date()

    const rules = await sql`
      SELECT 
        target_type,
        target_id
      FROM access_rules
      WHERE user_id = ${userId}
        AND is_active = true
        AND start_date <= ${now.toISOString()}
        AND end_date >= ${now.toISOString()}
    `

    const accessible = {
      documents: [] as string[],
      folders: [] as string[],
      tags: [] as string[],
      categories: [] as string[],
    }

    for (const rule of rules) {
      switch (rule.target_type) {
        case "document":
          accessible.documents.push(rule.target_id)
          break
        case "folder":
          accessible.folders.push(rule.target_id)
          break
        case "tag":
          accessible.tags.push(rule.target_id)
          break
        case "category":
          accessible.categories.push(rule.target_id)
          break
      }
    }

    return accessible
  } catch (error) {
    console.error("Erreur lors de la récupération des cibles accessibles:", error)
    return {
      documents: [],
      folders: [],
      tags: [],
      categories: [],
    }
  }
}
