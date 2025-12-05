"use client"

import { useAuth } from "@/hooks/useAuth"
import { useAccessControl } from "@/hooks/useAccessControl"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  FileText, 
  Folder, 
  Tag, 
  LayoutGrid, 
  Clock, 
  Shield,
  LogOut,
  Eye,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  User,
  X,
  Maximize2,
  FileTextIcon,
  ExternalLink,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { signOut } from "next-auth/react"

const targetTypeConfig = {
  document: { label: "Document", icon: FileText, color: "bg-blue-500", lightColor: "bg-blue-100 dark:bg-blue-900/30", textColor: "text-blue-600 dark:text-blue-400" },
  folder: { label: "Dossier", icon: Folder, color: "bg-amber-500", lightColor: "bg-amber-100 dark:bg-amber-900/30", textColor: "text-amber-600 dark:text-amber-400" },
  tag: { label: "Tag", icon: Tag, color: "bg-emerald-500", lightColor: "bg-emerald-100 dark:bg-emerald-900/30", textColor: "text-emerald-600 dark:text-emerald-400" },
  category: { label: "Catégorie", icon: LayoutGrid, color: "bg-purple-500", lightColor: "bg-purple-100 dark:bg-purple-900/30", textColor: "text-purple-600 dark:text-purple-400" },
}

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated, isAdmin } = useAuth()
  const { accessRules, loading: accessLoading } = useAccessControl()
  const router = useRouter()
  
  // State for document preview modal
  const [viewingDocument, setViewingDocument] = useState<{id: string, name: string} | null>(null)
  // State for document summary modal
  const [summaryDocument, setSummaryDocument] = useState<{id: string, name: string} | null>(null)
  // State for SSO loading
  const [isSsoLoading, setIsSsoLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/")
    }
    if (!isLoading && isAdmin) {
      router.push("/admin")
    }
  }, [isLoading, isAuthenticated, isAdmin, router])

  if (isLoading || accessLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-zinc-600 dark:text-zinc-400 font-medium">Chargement de votre espace...</p>
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
      month: "short",
      year: "numeric",
    })
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getProgressPercentage = (startDate: string, endDate: string) => {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    const now = new Date().getTime()
    const total = end - start
    const elapsed = now - start
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
  }

  // Stats - Only count non-expired access
  const activeRules = accessRules.filter(r => getDaysRemaining(r.endDate) > 0)
  const totalDocuments = activeRules.filter(r => r.targetType === 'document').length
  const expiringSoon = activeRules.filter(r => getDaysRemaining(r.endDate) <= 7).length // Expire dans 7 jours ou moins
  const activeAccess = activeRules.length

  // SSO function to access Mayan EDMS
  const handleSsoLogin = async () => {
    setIsSsoLoading(true)
    try {
      
      
      const clientId = 'mayan-edms'
      const redirectUri = `${process.env.MAYAN_BASE_URL || 'http://localhost:8000'}/oidc/callback/`
      const scope = 'openid profile email groups permissions'
      const responseType = 'code'
      const state = 'security_token_' + Math.random().toString(36).substring(7)
      const nonce = 'nonce_' + Math.random().toString(36).substring(7)
      
      const authorizeUrl = `/api/oidc/authorize?` + 
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=${encodeURIComponent(responseType)}&` +
        `state=${encodeURIComponent(state)}&` +
        `nonce=${encodeURIComponent(nonce)}`
        
      console.log('[SSO] Initiating OIDC flow via:', authorizeUrl)
      
      // Redirect to our Authorize endpoint
      window.location.href = authorizeUrl
      
    } catch (error) {
      console.error('SSO login failed:', error)
      // Fallback
      window.open(process.env.MAYAN_BASE_URL || 'http://localhost:8000', '_blank')
    } finally {
      // setIsSsoLoading(false) // Don't reset if redirecting
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 dark:from-zinc-600 dark:to-zinc-800 shadow-md">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Bonjour, {user?.name?.split(' ')[0]} 
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSsoLogin}
                disabled={isSsoLoading}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSsoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {isSsoLoading ? 'Connexion...' : 'Mayan EDMS'}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{totalDocuments}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Documents accessibles</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{activeAccess}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Accès actifs</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{expiringSoon}</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Expirent bientôt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Mes Documents
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ressources auxquelles vous avez accès temporairement
            </p>
          </div>
        </div>

        {/* Access Rules - Only show non-expired */}
        {activeRules.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
              <Clock className="h-10 w-10 text-zinc-400" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Aucun accès temporaire
            </h3>
            <p className="mx-auto max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              Vous n'avez actuellement aucun accès temporaire actif.
              Contactez un administrateur pour obtenir des accès aux documents.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeRules.map((rule) => {
              const config = targetTypeConfig[rule.targetType as keyof typeof targetTypeConfig]
              const Icon = config.icon
              const daysRemaining = getDaysRemaining(rule.endDate)
              const isExpiringSoon = daysRemaining <= 7 // Cohérent avec le compteur
              const progress = getProgressPercentage(rule.startDate, rule.endDate)

              return (
                <div
                  key={rule.id}
                  className={`group relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-zinc-900 ${
                    isExpiringSoon 
                      ? 'border-orange-200 dark:border-orange-800/50' 
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {/* Status Badge */}
                  <div className="absolute right-4 top-4">
                    {isExpiringSoon ? (
                      <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        {daysRemaining}j restant{daysRemaining > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Actif
                      </span>
                    )}
                  </div>

                  {/* Icon & Title */}
                  <div className="mb-4 flex items-start gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.lightColor}`}>
                      <Icon className={`h-6 w-6 ${config.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0 pr-16">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {rule.targetName}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {config.label}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 dark:text-zinc-400">Temps restant</span>
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">
                        {daysRemaining > 0 ? `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}` : 'Expiré'}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isExpiringSoon 
                            ? 'bg-orange-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${100 - progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="mb-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(rule.startDate)} → {formatDate(rule.endDate)}</span>
                  </div>

                  {/* Actions */}
                  {rule.targetType === 'document' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewingDocument({ id: rule.targetId, name: rule.targetName })}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        <Eye className="h-4 w-4" />
                        Voir
                      </button>
                      <button
                        onClick={() => setSummaryDocument({ id: rule.targetId, name: rule.targetName })}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        <FileTextIcon className="h-4 w-4" />
                        Résumé
                      </button>
                      <a
                        href={`/api/documents/${rule.targetId}/download?download=true`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4" />
                        Télécharger
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 dark:border-blue-800/50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                À propos des accès temporaires
              </h4>
              <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                Les accès temporaires vous permettent de consulter les documents pendant une période limitée. 
                Une fois l'accès expiré, vous ne pourrez plus accéder à ces ressources. 
                Pensez à télécharger les documents importants avant l'expiration.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Document Summary Modal */}
      {summaryDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            onClick={() => setSummaryDocument(null)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <FileTextIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    Résumé du document
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {summaryDocument.name}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setSummaryDocument(null)}
                className="flex items-center justify-center h-10 w-10 rounded-lg text-zinc-500 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:text-zinc-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Summary Content */}
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Informations générales</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">Nom du document:</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{summaryDocument.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">ID:</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{summaryDocument.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500 dark:text-zinc-400">Type:</span>
                      <span className="text-zinc-900 dark:text-zinc-100">Document PDF</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                  <h4 className="font-medium text-zinc-900 dark:text-zinc-100 mb-2">Actions disponibles</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setViewingDocument({ id: summaryDocument.id, name: summaryDocument.name })
                        setSummaryDocument(null)
                      }}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      <Eye className="h-4 w-4" />
                      Voir le document
                    </button>
                    <a
                      href={`/api/documents/${summaryDocument.id}/download?download=true`}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </a>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Note</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Cette fenêtre de résumé vous donne un aperçu rapide des informations du document. 
                    Pour voir le contenu complet, cliquez sur "Voir le document".
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            onClick={() => setViewingDocument(null)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {viewingDocument.name}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Aperçu du document
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link
                  href={`/documents/${viewingDocument.id}`}
                  target="_blank"
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-all hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  <Maximize2 className="h-4 w-4" />
                  Plein écran
                </Link>
                <a
                  href={`/api/documents/${viewingDocument.id}/download?download=true`}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </a>
                <button
                  onClick={() => setViewingDocument(null)}
                  className="flex items-center justify-center h-10 w-10 rounded-lg text-zinc-500 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:text-zinc-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 bg-zinc-100 dark:bg-zinc-800">
              <iframe
                src={`/api/documents/${viewingDocument.id}/download`}
                className="w-full h-full border-0"
                title={`Aperçu de ${viewingDocument.name}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
