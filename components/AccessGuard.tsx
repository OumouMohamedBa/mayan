"use client"

import { ReactNode } from "react"
import { useAccessControl } from "@/hooks/useAccessControl"
import { Lock, Clock } from "lucide-react"

interface AccessGuardProps {
  children: ReactNode
  targetType: "document" | "folder" | "tag" | "category"
  targetId: string
  documentMetadata?: {
    folderId?: string
    tagIds?: string[]
    categoryId?: string
  }
  fallback?: ReactNode
  showAccessInfo?: boolean
}

/**
 * Composant qui protège son contenu en vérifiant les règles d'accès
 */
export function AccessGuard({
  children,
  targetType,
  targetId,
  documentMetadata,
  fallback,
  showAccessInfo = false,
}: AccessGuardProps) {
  const { hasAccessTo, hasDocumentAccess, getAccessRule, loading, isAdmin } = useAccessControl()

  // Pendant le chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
      </div>
    )
  }

  // Vérifier l'accès
  let hasAccess = false

  if (targetType === "document" && documentMetadata) {
    hasAccess = hasDocumentAccess(targetId, documentMetadata)
  } else {
    hasAccess = hasAccessTo(targetType, targetId)
  }

  // Si pas d'accès, afficher le fallback ou le message par défaut
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Accès refusé
        </h3>
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Vous n'avez pas les droits d'accès à cette ressource.
          <br />
          Contactez un administrateur pour obtenir l'accès.
        </p>
      </div>
    )
  }

  // Si accès autorisé et qu'on veut afficher les infos d'accès
  if (showAccessInfo && !isAdmin) {
    const rule = getAccessRule(targetType, targetId)

    if (rule) {
      const endDate = new Date(rule.endDate)
      const now = new Date()
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      return (
        <div>
          {/* Bandeau d'information sur l'accès temporaire */}
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            <Clock className="h-4 w-4" />
            <span>
              Accès temporaire via <strong>{rule.targetName}</strong> — 
              {daysRemaining > 0 
                ? ` expire dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`
                : " expire aujourd'hui"
              }
            </span>
          </div>
          {children}
        </div>
      )
    }
  }

  // Afficher le contenu normalement
  return <>{children}</>
}

/**
 * Hook pour vérifier l'accès de manière programmatique
 */
export function useAccessGuard() {
  const { hasAccessTo, hasDocumentAccess, checkAccess, isAdmin, loading } = useAccessControl()

  return {
    // Vérification synchrone (utilise le cache local)
    canAccess: (
      targetType: "document" | "folder" | "tag" | "category",
      targetId: string,
      documentMetadata?: { folderId?: string; tagIds?: string[]; categoryId?: string }
    ) => {
      if (isAdmin) return true
      
      if (targetType === "document" && documentMetadata) {
        return hasDocumentAccess(targetId, documentMetadata)
      }
      return hasAccessTo(targetType, targetId)
    },

    // Vérification asynchrone (appel serveur)
    verifyAccess: checkAccess,

    isAdmin,
    loading,
  }
}
