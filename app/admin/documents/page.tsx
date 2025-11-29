"use client"

import { FileText, Search, Plus, RefreshCw } from "lucide-react"
import { useState } from "react"

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Gestion des Documents
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Gérez tous les documents du système
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
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <FileText className="h-8 w-8 text-zinc-400" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
          Aucun document
        </h3>
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Commencez par ajouter votre premier document
        </p>
        <button className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
          <Plus className="h-4 w-4" />
          Ajouter un document
        </button>
      </div>
    </div>
  )
}
