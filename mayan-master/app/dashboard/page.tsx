"use client"

import { useAuth } from "@/hooks/useAuth"
import { useAccessControl } from "@/hooks/useAccessControl"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { 
  FileText, 
  Folder, 
  Tag, 
  LayoutGrid, 
  Clock, 
  Shield,
  LogOut
} from "lucide-react"
import { signOut } from "next-auth/react"

const targetTypeConfig = {
  document: { label: "Document", icon: FileText, color: "bg-blue-500" },
  folder: { label: "Dossier", icon: Folder, color: "bg-yellow-500" },
  tag: { label: "Tag", icon: Tag, color: "bg-green-500" },
  category: { label: "Catégorie", icon: LayoutGrid, color: "bg-purple-500" },
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth()
  const { accessRules, loading: accessLoading } = useAccessControl()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
    // Rediriger les admins vers le panel admin
    if (!isLoading && isAdmin) {
      router.push("/admin")
    }
  }, [isLoading, isAuthenticated, isAdmin, router])

  if (isLoading || accessLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          <p className="text-zinc-600 dark:text-zinc-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
              <Shield className="h-5 w-5 text-white dark:text-zinc-900" />
            </div>
            <div>
              <h1 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Mon Espace
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Bonjour, {user?.name} 👋
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Voici vos accès temporaires aux ressources
          </p>
        </div>

        {/* Access Rules */}
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              Mes accès temporaires
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Liste des ressources auxquelles vous avez accès
            </p>
          </div>

          {accessRules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                <Clock className="h-8 w-8 text-zinc-400" />
              </div>
              <h4 className="mb-2 font-medium text-zinc-900 dark:text-zinc-100">
                Aucun accès temporaire
              </h4>
              <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                Vous n'avez actuellement aucun accès temporaire actif.
                <br />
                Contactez un administrateur pour obtenir des accès.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {accessRules.map((rule) => {
                const config = targetTypeConfig[rule.targetType as keyof typeof targetTypeConfig]
                const Icon = config.icon
                const daysRemaining = getDaysRemaining(rule.endDate)
                const isExpiringSoon = daysRemaining <= 3

                return (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {rule.targetName}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {config.label} • ID: {rule.targetId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${
                        isExpiringSoon 
                          ? "text-orange-600 dark:text-orange-400" 
                          : "text-zinc-900 dark:text-zinc-100"
                      }`}>
                        {daysRemaining > 0 
                          ? `${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} restant${daysRemaining > 1 ? "s" : ""}`
                          : "Expire aujourd'hui"
                        }
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Jusqu'au {formatDate(rule.endDate)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            <strong>Note :</strong> Les accès temporaires vous permettent de consulter 
            les documents, dossiers, tags ou catégories spécifiés pendant une période limitée. 
            Une fois l'accès expiré, vous ne pourrez plus accéder à ces ressources.
          </p>
        </div>
      </main>
    </div>
  )
}
