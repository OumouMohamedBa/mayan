"use client"

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  FileText, 
  Download, 
  Eye, 
  ArrowLeft, 
  Calendar, 
  File, 
  Info,
  History,
  Loader2
} from "lucide-react"
import { MayanDocument, MayanDocumentVersion } from "@/lib/mayanClient"

interface DocumentDetailsResponse {
  document: MayanDocument
  versions: MayanDocumentVersion[]
  totalVersions: number
}

export default function DocumentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const documentId = params.id as string

  const [documentData, setDocumentData] = useState<MayanDocument | null>(null)
  const [versions, setVersions] = useState<MayanDocumentVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloadingVersion, setDownloadingVersion] = useState<number | null>(null)

  const fetchDocumentDetails = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/documents/${documentId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch document details')
      }

      const data: DocumentDetailsResponse = await response.json()
      setDocumentData(data.document)
      setVersions(data.versions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const downloadVersion = async (versionId: number) => {
    setDownloadingVersion(versionId)
    
    try {
      const response = await fetch(`/api/documents/${documentId}/download/${versionId}`)
      
      if (!response.ok) {
        throw new Error('Failed to download document')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from the latest version or use a default
      const filename = versions.find(v => v.id === versionId)?.file_filename || `document-${documentId}-v${versionId}`
      a.download = filename
      
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download error:', err)
      alert('Failed to download document')
    } finally {
      setDownloadingVersion(null)
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

  const getFileIcon = (mimetype: string) => {
    if (mimetype.includes('pdf')) return '📄'
    if (mimetype.includes('image')) return '🖼️'
    if (mimetype.includes('text')) return '📝'
    if (mimetype.includes('word') || mimetype.includes('document')) return '📄'
    if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return '📊'
    if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return '📽️'
    return '📄'
  }

  useEffect(() => {
    if (documentId) {
      fetchDocumentDetails()
    }
  }, [documentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          <p className="text-zinc-600 dark:text-zinc-400">Chargement du document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <Info className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Erreur
          </h2>
          <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
            {error}
          </p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        </div>
      </div>
    )
  }

  if (!documentData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Document non trouvé
          </h2>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <span className="text-2xl">
                {getFileIcon(documentData.latest_version?.file_mimetype || '')}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {documentData.label}
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                {documentData.document_type_label}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => downloadVersion(documentData.latest_version?.id || versions[0]?.id)}
            disabled={!versions.length}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Download className="h-4 w-4" />
            Télécharger
          </button>
        </div>
      </div>

      {/* Document Info */}
      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
          <Info className="h-5 w-5" />
          Informations du document
        </h2>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">ID</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{documentData.id}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">UUID</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100 font-mono">{documentData.uuid}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Type de document</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{documentData.document_type_label}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Langue</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{documentData.language || 'Non spécifiée'}</dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Date de création</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(documentData.datetime_created)}
              </div>
            </dd>
          </div>
          
          <div>
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Nombre de versions</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{documentData.versions_count}</dd>
          </div>
        </div>
        
        {documentData.description && (
          <div className="mt-4">
            <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Description</dt>
            <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
              {documentData.description}
            </dd>
          </div>
        )}
      </div>

      {/* Versions */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-6 dark:border-zinc-700">
          <h2 className="flex items-center gap-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            <History className="h-5 w-5" />
            Versions ({versions.length})
          </h2>
        </div>
        
        {versions.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="mx-auto h-12 w-12 text-zinc-400" />
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Aucune version disponible
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {versions.map((version, index) => (
              <div key={version.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                        <span className="text-sm">
                          {getFileIcon(version.file_mimetype)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                          Version {versions.length - index}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {version.file_filename}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(version.timestamp)}
                      </div>
                      <div>
                        {formatFileSize(version.file_size)}
                      </div>
                      <div>
                        {version.page_count} page{version.page_count !== 1 ? 's' : ''}
                      </div>
                      <div>
                        {version.file_mimetype}
                      </div>
                      {version.active && (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      )}
                    </div>
                    
                    {version.comment && (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {version.comment}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                      <Eye className="h-3 w-3" />
                      Voir
                    </button>
                    <button
                      onClick={() => downloadVersion(version.id)}
                      disabled={downloadingVersion === version.id}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Download className="h-3 w-3" />
                      {downloadingVersion === version.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        'Télécharger'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
