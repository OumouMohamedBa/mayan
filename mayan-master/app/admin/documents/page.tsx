"use client"

import { FileText, Search, Plus, RefreshCw, Download, Eye, Calendar, File } from "lucide-react"
import { useState, useEffect } from "react"
import { MayanDocument, MayanPaginatedResponse } from "@/lib/mayanClient"
import Link from "next/link"

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [documents, setDocuments] = useState<MayanDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  const fetchDocuments = async (query?: string, page: number = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      })
      
      if (query && query.trim()) {
        params.append('q', query.trim())
      }

      const response = await fetch(`/api/documents?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch documents')
      }

      const data: MayanPaginatedResponse<MayanDocument> = await response.json()
      setDocuments(data.results)
      setTotalCount(data.count)
      setCurrentPage(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents')
      setDocuments([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleSearch = () => {
    fetchDocuments(searchQuery, 1)
  }

  const handleRefresh = () => {
    fetchDocuments(searchQuery, currentPage)
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Gestion des Documents
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Gérez tous les documents du système ({totalCount} document{totalCount !== 1 ? 's' : ''})
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
          <Plus className="h-4 w-4" />
          Ajouter un document
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleSearch}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Search className="h-4 w-4" />
            Rechercher
          </button>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm text-red-800 dark:text-red-200">
            Erreur: {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && documents.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
            <p className="text-zinc-600 dark:text-zinc-400">Chargement des documents...</p>
          </div>
        </div>
      ) : documents.length === 0 && !error ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <FileText className="h-8 w-8 text-zinc-400" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {searchQuery ? 'Aucun résultat trouvé' : 'Aucun document'}
          </h3>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            {searchQuery ? 'Essayez une autre recherche' : 'Commencez par ajouter votre premier document'}
          </p>
          <button className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
            <Plus className="h-4 w-4" />
            Ajouter un document
          </button>
        </div>
      ) : (
        /* Documents List */
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <File className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                    </div>
                    <div>
                      <Link 
                        href={`/documents/${doc.id}`}
                        className="font-medium text-zinc-900 hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300 transition-colors"
                      >
                        {doc.label}
                      </Link>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {doc.document_type_label}
                      </p>
                    </div>
                  </div>
                  
                  {doc.description && (
                    <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(doc.datetime_created)}
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {doc.versions_count} version{doc.versions_count !== 1 ? 's' : ''}
                    </div>
                    {doc.latest_version && (
                      <div>
                        {formatFileSize(doc.latest_version.file_size)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Link 
                    href={`/documents/${doc.id}`}
                    className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <Eye className="h-3 w-3" />
                    Voir
                  </Link>
                  <button className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                    <Download className="h-3 w-3" />
                    Télécharger
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => fetchDocuments(searchQuery, currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Précédent
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Page {currentPage} sur {Math.ceil(totalCount / pageSize)}
              </span>
              <button
                onClick={() => fetchDocuments(searchQuery, currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
