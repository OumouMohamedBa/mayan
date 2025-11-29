"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Power,
  PowerOff,
  RefreshCw,
  Filter,
  FileText,
  Folder,
  Tag,
  LayoutGrid,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { AccessRuleModal } from "@/components/admin/AccessRuleModal"
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal"

interface AccessRule {
  id: string
  userId: string
  userName: string
  userEmail: string
  targetType: "document" | "folder" | "tag" | "category"
  targetId: string
  targetName: string
  startDate: string
  endDate: string
  isActive: boolean
  status: "upcoming" | "active" | "expired" | "disabled"
  createdAt: string
}

interface User {
  id: string
  name: string
  email: string
}

const targetTypeLabels: Record<string, string> = {
  document: "Document",
  folder: "Dossier",
  tag: "Tag",
  category: "Catégorie",
}

const targetTypeIcons: Record<string, typeof FileText> = {
  document: FileText,
  folder: Folder,
  tag: Tag,
  category: LayoutGrid,
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  upcoming: {
    label: "À venir",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Clock,
  },
  active: {
    label: "Actif",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  },
  expired: {
    label: "Expiré",
    color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500",
    icon: XCircle,
  },
  disabled: {
    label: "Désactivé",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    icon: AlertCircle,
  },
}

export default function AccessRulesPage() {
  const [rules, setRules] = useState<AccessRule[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [filterTargetType, setFilterTargetType] = useState<string>("")
  const [filterUserId, setFilterUserId] = useState<string>("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedRule, setSelectedRule] = useState<AccessRule | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const fetchRules = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterUserId) params.append("userId", filterUserId)
      if (filterStatus) params.append("status", filterStatus)
      if (filterTargetType) params.append("targetType", filterTargetType)

      const response = await fetch(`/api/admin/access-rules?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setRules(data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des règles:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error)
    }
  }

  useEffect(() => {
    fetchRules()
    fetchUsers()
  }, [filterUserId, filterStatus, filterTargetType])

  const filteredRules = rules.filter(
    (rule) =>
      rule.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.targetName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddRule = () => {
    setSelectedRule(null)
    setIsModalOpen(true)
  }

  const handleEditRule = (rule: AccessRule) => {
    setSelectedRule(rule)
    setIsModalOpen(true)
    setActionMenuOpen(null)
  }

  const handleDeleteRule = (rule: AccessRule) => {
    setSelectedRule(rule)
    setIsDeleteModalOpen(true)
    setActionMenuOpen(null)
  }

  const handleToggleActive = async (rule: AccessRule) => {
    try {
      const response = await fetch(`/api/admin/access-rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      })
      if (response.ok) {
        fetchRules()
      }
    } catch (error) {
      console.error("Erreur lors de la modification du statut:", error)
    }
    setActionMenuOpen(null)
  }

  const confirmDelete = async () => {
    if (!selectedRule) return
    try {
      const response = await fetch(`/api/admin/access-rules/${selectedRule.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setRules(rules.filter((r) => r.id !== selectedRule.id))
        setIsDeleteModalOpen(false)
        setSelectedRule(null)
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
    }
  }

  const handleSaveRule = async (ruleData: any) => {
    try {
      if (selectedRule) {
        const response = await fetch(`/api/admin/access-rules/${selectedRule.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ruleData),
        })
        if (response.ok) {
          fetchRules()
        }
      } else {
        const response = await fetch("/api/admin/access-rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ruleData),
        })
        if (response.ok) {
          fetchRules()
        }
      }
      setIsModalOpen(false)
      setSelectedRule(null)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const clearFilters = () => {
    setFilterStatus("")
    setFilterTargetType("")
    setFilterUserId("")
  }

  const hasActiveFilters = filterStatus || filterTargetType || filterUserId

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Règles d'Accès Temporaires
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Gérez les accès temporaires aux documents, dossiers et tags
          </p>
        </div>
        <button
          onClick={handleAddRule}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          Créer une règle
        </button>
      </div>

      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Rechercher par utilisateur ou cible..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                hasActiveFilters
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtres
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                  {[filterStatus, filterTargetType, filterUserId].filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={fetchRules}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap gap-4">
              {/* Filter by user */}
              <div className="min-w-[200px]">
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Utilisateur
                </label>
                <select
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">Tous les utilisateurs</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter by status */}
              <div className="min-w-[150px]">
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Statut
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">Tous les statuts</option>
                  <option value="upcoming">À venir</option>
                  <option value="active">Actif</option>
                  <option value="expired">Expiré</option>
                  <option value="disabled">Désactivé</option>
                </select>
              </div>

              {/* Filter by target type */}
              <div className="min-w-[150px]">
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Type de cible
                </label>
                <select
                  value={filterTargetType}
                  onChange={(e) => setFilterTargetType(e.target.value)}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">Tous les types</option>
                  <option value="document">Document</option>
                  <option value="folder">Dossier</option>
                  <option value="tag">Tag</option>
                  <option value="category">Catégorie</option>
                </select>
              </div>

              {hasActiveFilters && (
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Effacer les filtres
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Rules Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Cible
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-zinc-500">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Chargement...
                    </div>
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    Aucune règle d'accès trouvée
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const TargetIcon = targetTypeIcons[rule.targetType]
                  const statusInfo = statusConfig[rule.status]
                  const StatusIcon = statusInfo.icon

                  return (
                    <tr
                      key={rule.id}
                      className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {rule.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {rule.userName}
                            </p>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {rule.userEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            <TargetIcon className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {rule.targetName}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {targetTypeLabels[rule.targetType]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-zinc-900 dark:text-zinc-100">
                            {formatDate(rule.startDate)}
                          </p>
                          <p className="text-zinc-500 dark:text-zinc-400">
                            → {formatDate(rule.endDate)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setActionMenuOpen(
                                actionMenuOpen === rule.id ? null : rule.id
                              )
                            }
                            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {actionMenuOpen === rule.id && (
                            <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                              <button
                                onClick={() => handleEditRule(rule)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                <Edit className="h-4 w-4" />
                                Modifier
                              </button>
                              <button
                                onClick={() => handleToggleActive(rule)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                {rule.isActive ? (
                                  <>
                                    <PowerOff className="h-4 w-4" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-4 w-4" />
                                    Activer
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteRule(rule)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AccessRuleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedRule(null)
        }}
        onSave={handleSaveRule}
        rule={selectedRule}
        users={users}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedRule(null)
        }}
        onConfirm={confirmDelete}
        userName={selectedRule?.targetName || "cette règle"}
      />
    </div>
  )
}
