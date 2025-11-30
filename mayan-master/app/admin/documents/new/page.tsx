"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  FileText, 
  Upload, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Loader2 
} from "lucide-react"

interface DocumentType {
  id: number
  label: string
  description?: string
}

export default function NewDocumentPage() {
  const router = useRouter()
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Form state
  const [selectedTypeId, setSelectedTypeId] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [label, setLabel] = useState("")
  const [description, setDescription] = useState("")

  // Fetch document types on mount
  useEffect(() => {
    fetchDocumentTypes()
  }, [])

  const fetchDocumentTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/document-types')
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch document types')
      }

      const data = await response.json()
      setDocumentTypes(data.document_types || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch document types')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!selectedTypeId) {
      setError('Please select a document type')
      return
    }
    
    if (!selectedFile) {
      setError('Please select a file to upload')
      return
    }

    // File type validation
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg']
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only PDF, PNG, and JPG files are allowed')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('document_type_id', selectedTypeId)
      formData.append('file', selectedFile)
      
      if (label.trim()) {
        formData.append('label', label.trim())
      }
      
      if (description.trim()) {
        formData.append('description', description.trim())
      }

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload document')
      }

      const result = await response.json()
      
      // Success
      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/documents')
      }, 2000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Auto-populate label with filename if empty
      if (!label.trim()) {
        setLabel(file.name.replace(/\.[^/.]+$/, "")) // Remove extension
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/documents"
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload New Document</h1>
            <p className="text-gray-600">Add a new document to Mayan EDMS</p>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
          <span className="text-green-700">Document uploaded successfully! Redirecting...</span>
        </div>
      )}

      {/* No Document Types Warning */}
      {documentTypes.length === 0 && !loading && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
          <span className="text-yellow-700">
            No Document Types found. Please create one in Mayan first.
          </span>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Type Select */}
        <div>
          <label htmlFor="document_type" className="block text-sm font-medium text-gray-700 mb-2">
            Document Type <span className="text-red-500">*</span>
          </label>
          <select
            id="document_type"
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={documentTypes.length === 0}
          >
            <option value="">Select a document type...</option>
            {documentTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
                {type.description && ` - ${type.description}`}
              </option>
            ))}
          </select>
        </div>

        {/* File Input */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
            File <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="file"
              id="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Accepted formats: PDF, PNG, JPG (Max 50MB)
            </p>
          </div>
          {selectedFile && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        {/* Label Input */}
        <div>
          <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
            Label (optional)
          </label>
          <input
            type="text"
            id="label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Custom document title"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Description Textarea */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Document description or notes"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/admin/documents"
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={uploading || documentTypes.length === 0}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
