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
    color: "bg-blue-50 text-blue-700 border border-blue-200",
    icon: Clock,
  },
  active: {
    label: "Actif",
    color: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: CheckCircle,
  },
  expired: {
    label: "Expiré",
    color: "bg-stone-100 text-stone-500 border border-stone-200",
    icon: XCircle,
  },
  disabled: {
    label: "Désactivé",
    color: "bg-amber-50 text-amber-700 border border-amber-200",
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

  // Stats
  const activeRules = rules.filter(r => r.status === 'active').length
  const upcomingRules = rules.filter(r => r.status === 'upcoming').length
  const expiredRules = rules.filter(r => r.status === 'expired').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            Règles d'Accès Temporaires
          </h1>
          <p className="text-stone-500 mt-1">
            Gérez les accès temporaires aux documents, dossiers et tags
          </p>
        </div>
        <button
          onClick={handleAddRule}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Créer une règle
        </button>
      </div>

      {/* Stats Cards */}
     

      {/* Search and filters */}
      <div className="rounded-2xl bg-white border border-stone-200/60 p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher par utilisateur ou cible..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                hasActiveFilters
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                  : "border border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtres
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                  {[filterStatus, filterTargetType, filterUserId].filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={fetchRules}
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="rounded-xl border border-stone-100 bg-stone-50/50 p-4">
            <div className="flex flex-wrap gap-4">
              {/* Filter by user */}
              <div className="min-w-[200px]">
                <label className="mb-1.5 block text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Utilisateur
                </label>
                <select
                  value={filterUserId}
                  onChange={(e) => setFilterUserId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300"
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
                <label className="mb-1.5 block text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Statut
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300"
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
                <label className="mb-1.5 block text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Type de cible
                </label>
                <select
                  value={filterTargetType}
                  onChange={(e) => setFilterTargetType(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300"
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
                    className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
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
      <div className="overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Utilisateur
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Cible
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Période
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
                      <p className="text-stone-500 font-medium">Chargement des règles...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                        <Clock className="h-8 w-8 text-stone-400" />
                      </div>
                      <p className="text-stone-500 font-medium">Aucune règle d'accès trouvée</p>
                      <p className="text-sm text-stone-400">Créez une nouvelle règle pour commencer</p>
                    </div>
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
                      className="group transition-colors hover:bg-amber-50/30"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                            <span className="text-sm font-bold text-white">
                              {rule.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-stone-800">
                              {rule.userName}
                            </p>
                            <p className="text-sm text-stone-500">
                              {rule.userEmail}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100">
                            <TargetIcon className="h-5 w-5 text-stone-600" />
                          </div>
                          <div>
                            <p className="font-medium text-stone-800">
                              {rule.targetName}
                            </p>
                            <p className="text-xs text-stone-500">
                              {targetTypeLabels[rule.targetType]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-stone-700">
                            {formatDate(rule.startDate)}
                          </p>
                          <p className="text-stone-500">
                            → {formatDate(rule.endDate)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
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
                            className="rounded-lg p-2 text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-600"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>
                          {actionMenuOpen === rule.id && (
                            <div className="absolute right-0 z-10 mt-2 w-52 rounded-xl border border-stone-200 bg-white py-2 shadow-xl shadow-stone-200/50">
                              <button
                                onClick={() => handleEditRule(rule)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                              >
                                <Edit className="h-4 w-4 text-stone-400" />
                                Modifier
                              </button>
                              <button
                                onClick={() => handleToggleActive(rule)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                              >
                                {rule.isActive ? (
                                  <>
                                    <PowerOff className="h-4 w-4 text-stone-400" />
                                    Désactiver
                                  </>
                                ) : (
                                  <>
                                    <Power className="h-4 w-4 text-emerald-500" />
                                    Activer
                                  </>
                                )}
                              </button>
                              <div className="my-1 border-t border-stone-100" />
                              <button
                                onClick={() => handleDeleteRule(rule)}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
