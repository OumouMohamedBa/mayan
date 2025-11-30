"use client"

import { useState, useEffect, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Calendar, 
  File, 
  AlertCircle,
  Loader2,
  Eye,
  Info
} from "lucide-react"
import { MayanDocument, MayanDocumentVersion } from "@/lib/mayanClient"

interface DocumentDetailsResponse {
  document: MayanDocument
  versions: MayanDocumentVersion[]
  totalVersions: number
}

function DocumentDetailContent() {
  const params = useParams()
  const router = useRouter()
  const [documentDetails, setDocumentDetails] = useState<DocumentDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  // Handle params as Promise in Next.js 15
  const [documentId, setDocumentId] = useState<string | null>(null)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setDocumentId(resolvedParams.id as string)
    }
    getParams()
  }, [params])

  useEffect(() => {
    if (documentId) {
      fetchDocumentDetails()
    }
  }, [documentId])

  const fetchDocumentDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/documents/${documentId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document introuvable')
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch document details')
      }

      const data: DocumentDetailsResponse = await response.json()
      setDocumentDetails(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch document details')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (versionId?: number) => {
    try {
      setDownloading(true)
      
      const downloadUrl = versionId 
        ? `/api/documents/${documentId}/download/${versionId}`
        : `/api/documents/${documentId}/download`
      
      console.log('handleDownload - URL:', downloadUrl)
      
      const response = await fetch(downloadUrl)
      
      console.log('handleDownload - Response status:', response.status)
      console.log('handleDownload - Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        // Try to get error details
        let errorMessage = 'Failed to download document'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Failed to download document: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `document-${documentId}`
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      console.log('handleDownload - Filename:', filename)
      console.log('handleDownload - Content-Type:', response.headers.get('Content-Type'))

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = globalThis.document.createElement('a')
      a.href = url
      a.download = filename
      globalThis.document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      globalThis.document.body.removeChild(a)
      
    } catch (err) {
      console.error('handleDownload - Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to download document')
    } finally {
      setDownloading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement du document...</p>
        </div>
      </div>
    )
  }

  if (error || !documentDetails) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link 
            href="/admin/documents"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Link>
        </div>
        
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-16 dark:border-red-800 dark:bg-red-950">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            {error || 'Document introuvable'}
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-6 text-center">
            Le document que vous cherchez n'existe pas ou a été supprimé.
          </p>
          <Link
            href="/admin/documents"
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </div>
      </div>
    )
  }

  const { document, versions } = documentDetails

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/documents"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{document.label}</h1>
            <p className="text-gray-600">ID: {document.id}</p>
          </div>
        </div>
        
        <button
          onClick={() => handleDownload()}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Télécharger
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Informations
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Type de document</p>
                <p className="font-medium text-gray-900">{document.document_type_label}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Date de création</p>
                <p className="font-medium text-gray-900">{formatDate(document.datetime_created)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">UUID</p>
                <p className="font-mono text-sm text-gray-600">{document.uuid}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Nombre de versions</p>
                <p className="font-medium text-gray-900">{document.versions_count}</p>
              </div>
              
              {document.language && (
                <div>
                  <p className="text-sm text-gray-500">Langue</p>
                  <p className="font-medium text-gray-900">{document.language}</p>
                </div>
              )}
              
              {document.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{document.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Versions Card */}
          {versions.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Versions
              </h2>
              
              <div className="space-y-3">
                {versions.map((version) => (
                  <div key={version.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">Version {version.id}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(version.timestamp)} • {formatFileSize(version.file_size)}
                      </p>
                      <p className="text-xs text-gray-600">{version.file_filename}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(version.id)}
                      disabled={downloading}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Aperçu
              </h2>
            </div>
            
            <div className="p-4">
              {document.latest_version ? (
                <div className="w-full h-[800px] bg-gray-50 rounded-lg overflow-hidden">
                  {document.latest_version.file_mimetype?.startsWith('image/') ? (
                    // For images, use img tag
                    <img
                      src={`/api/documents/${document.id}/download`}
                      alt={document.label}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : document.latest_version.file_mimetype === 'application/pdf' ? (
                    // For PDFs, use iframe
                    <iframe
                      src={`/api/documents/${document.id}/download`}
                      className="w-full h-full border-0"
                      title={`Aperçu de ${document.label}`}
                      loading="lazy"
                    />
                  ) : (
                    // For other file types, show download prompt
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <File className="h-16 w-16 mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">Aperçu non disponible</p>
                      <p className="text-sm text-center mb-4">
                        Type de fichier: {document.latest_version.file_mimetype || 'Inconnu'}
                      </p>
                      <button
                        onClick={() => handleDownload()}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {downloading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Téléchargement...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Télécharger pour voir
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-gray-500">
                  <File className="h-16 w-16 mb-4 text-gray-400" />
                  <p>Aperçu non disponible</p>
                  <p className="text-sm">Ce document n'a pas de version téléchargeable</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DocumentDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <DocumentDetailContent />
    </Suspense>
  )
}
