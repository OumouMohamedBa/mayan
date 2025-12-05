"use client"

import { FileText, Search, Plus, RefreshCw, Download, Eye, Calendar, File, Trash, Upload, FolderOpen, HardDrive } from "lucide-react"
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

  const handleDelete = async (id: number, label: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le document "${label}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete document');
      }

      // Show success message (simple alert for now as requested)
      // In a real app, we would use a toast notification
      // alert('Document supprimé avec succès');
      
      // Remove from local state immediately for better UX
      setDocuments(docs => docs.filter(d => d.id !== id));
      setTotalCount(count => count - 1);
      
      // Or refresh the list
      // fetchDocuments(searchQuery, currentPage);
    } catch (err) {
      console.error('Delete error:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
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

  // Calculate total size
  const totalSize = documents.reduce((acc, doc) => acc + (doc.latest_version?.file_size || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            Gestion des Documents
          </h1>
          <p className="text-stone-500 mt-1">
            Gérez tous les documents du système
          </p>
        </div>
        <Link 
          href="/admin/documents/new"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
        >
          <Upload className="h-4 w-4" />
          Ajouter un document
        </Link>
      </div>


      {/* Search */}
      <div className="rounded-2xl bg-white border border-stone-200/60 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher un document..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSearch}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:shadow-lg"
            >
              <Search className="h-4 w-4" />
              Rechercher
            </button>
            <button 
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700 font-medium">
            Erreur: {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200/60 bg-white py-16 shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500 mb-4" />
          <p className="text-stone-500 font-medium">Chargement des documents...</p>
        </div>
      ) : documents.length === 0 && !error ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200/60 bg-white py-16 shadow-sm">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100">
            <FileText className="h-10 w-10 text-stone-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-stone-800">
            {searchQuery ? 'Aucun résultat trouvé' : 'Aucun document'}
          </h3>
          <p className="mb-6 text-sm text-stone-500">
            {searchQuery ? 'Essayez une autre recherche' : 'Commencez par ajouter votre premier document'}
          </p>
          <Link 
            href="/admin/documents/new"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl"
          >
            <Upload className="h-4 w-4" />
            Ajouter un document
          </Link>
        </div>
      ) : (
        /* Documents List */
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="group rounded-2xl border border-stone-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-stone-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
                      <File className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <Link 
                        href={`/admin/documents/${doc.id}`}
                        className="font-semibold text-stone-800 hover:text-amber-600 transition-colors"
                      >
                        {doc.label}
                      </Link>
                      <p className="text-sm text-stone-500">
                        {doc.document_type_label}
                      </p>
                    </div>
                  </div>
                  
                  {doc.description && (
                    <p className="mb-3 text-sm text-stone-600 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-stone-500">
                    <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(doc.datetime_created)}
                    </div>
                    <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg">
                      <FileText className="h-3.5 w-3.5" />
                      {doc.versions_count} version{doc.versions_count !== 1 ? 's' : ''}
                    </div>
                    {doc.latest_version && (
                      <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg">
                        <HardDrive className="h-3.5 w-3.5" />
                        {formatFileSize(doc.latest_version.file_size)}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Link 
                    href={`/admin/documents/${doc.id}`}
                    className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 hover:border-stone-300"
                  >
                    <Eye className="h-4 w-4" />
                    Voir
                  </Link>
                 
                  <button 
                    onClick={() => handleDelete(doc.id, doc.label)}
                    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-100 hover:border-red-300"
                    title="Supprimer le document"
                  >
                    <Trash className="h-4 w-4" />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => fetchDocuments(searchQuery, currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchDocuments(searchQuery, page)}
                    className={`h-10 w-10 rounded-xl text-sm font-medium transition-all ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                        : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => fetchDocuments(searchQuery, currentPage + 1)}
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 disabled:opacity-50"
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
