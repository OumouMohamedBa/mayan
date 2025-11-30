"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "./useAuth"

interface AccessRule {
  id: string
  targetType: "document" | "folder" | "tag" | "category"
  targetId: string
  targetName: string
  startDate: string
  endDate: string
}

interface AccessibleTargets {
  documents: string[]
  folders: string[]
  tags: string[]
  categories: string[]
}

interface AccessCheckResult {
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

export function useAccessControl() {
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [accessRules, setAccessRules] = useState<AccessRule[]>([])
  const [accessibleTargets, setAccessibleTargets] = useState<AccessibleTargets>({
    documents: [],
    folders: [],
    tags: [],
    categories: [],
  })
  const [loading, setLoading] = useState(true)

  // Charger les règles d'accès de l'utilisateur
  const fetchUserAccess = useCallback(async () => {
    if (!isAuthenticated || isAdmin) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/user/access")
      if (response.ok) {
        const data = await response.json()
        setAccessRules(data.rules || [])
        setAccessibleTargets(data.accessible || {
          documents: [],
          folders: [],
          tags: [],
          categories: [],
        })
      }
    } catch (error) {
      console.error("Erreur lors du chargement des accès:", error)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, isAdmin])

  useEffect(() => {
    fetchUserAccess()
  }, [fetchUserAccess])

  // Vérifier l'accès à une ressource (côté client - vérification rapide)
  const hasAccessTo = useCallback(
    (targetType: "document" | "folder" | "tag" | "category", targetId: string): boolean => {
      // Les admins ont accès à tout
      if (isAdmin) return true

      // Vérifier dans les cibles accessibles
      switch (targetType) {
        case "document":
          return accessibleTargets.documents.includes(targetId)
        case "folder":
          return accessibleTargets.folders.includes(targetId)
        case "tag":
          return accessibleTargets.tags.includes(targetId)
        case "category":
          return accessibleTargets.categories.includes(targetId)
        default:
          return false
      }
    },
    [isAdmin, accessibleTargets]
  )

  // Vérifier l'accès à un document (avec vérification des dossiers/tags/catégories)
  const hasDocumentAccess = useCallback(
    (
      documentId: string,
      metadata?: { folderId?: string; tagIds?: string[]; categoryId?: string }
    ): boolean => {
      // Les admins ont accès à tout
      if (isAdmin) return true

      // Vérifier l'accès direct au document
      if (accessibleTargets.documents.includes(documentId)) {
        return true
      }

      // Vérifier l'accès via les métadonnées
      if (metadata) {
        // Accès via le dossier
        if (metadata.folderId && accessibleTargets.folders.includes(metadata.folderId)) {
          return true
        }

        // Accès via les tags
        if (metadata.tagIds) {
          for (const tagId of metadata.tagIds) {
            if (accessibleTargets.tags.includes(tagId)) {
              return true
            }
          }
        }

        // Accès via la catégorie
        if (metadata.categoryId && accessibleTargets.categories.includes(metadata.categoryId)) {
          return true
        }
      }

      return false
    },
    [isAdmin, accessibleTargets]
  )

  // Vérifier l'accès côté serveur (pour les opérations critiques)
  const checkAccess = useCallback(
    async (
      targetType: "document" | "folder" | "tag" | "category",
      targetId: string,
      documentMetadata?: { folderId?: string; tagIds?: string[]; categoryId?: string }
    ): Promise<AccessCheckResult> => {
      // Les admins ont accès à tout
      if (isAdmin) {
        return { hasAccess: true }
      }

      try {
        const response = await fetch("/api/user/access/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetType, targetId, documentMetadata }),
        })

        if (response.ok) {
          return await response.json()
        }

        return { hasAccess: false, reason: "Erreur lors de la vérification" }
      } catch (error) {
        console.error("Erreur lors de la vérification d'accès:", error)
        return { hasAccess: false, reason: "Erreur de connexion" }
      }
    },
    [isAdmin]
  )

  // Récupérer la règle d'accès pour une cible spécifique
  const getAccessRule = useCallback(
    (targetType: "document" | "folder" | "tag" | "category", targetId: string): AccessRule | undefined => {
      return accessRules.find(
        (rule) => rule.targetType === targetType && rule.targetId === targetId
      )
    },
    [accessRules]
  )

  // Rafraîchir les accès
  const refreshAccess = useCallback(() => {
    setLoading(true)
    fetchUserAccess()
  }, [fetchUserAccess])

  return {
    // État
    accessRules,
    accessibleTargets,
    loading,
    isAdmin,

    // Méthodes de vérification
    hasAccessTo,
    hasDocumentAccess,
    checkAccess,
    getAccessRule,

    // Actions
    refreshAccess,
  }
}
