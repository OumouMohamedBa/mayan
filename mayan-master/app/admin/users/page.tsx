"use client"

import { useEffect, useState } from "react"
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  RefreshCw,
  Users,
  Shield,
  Mail,
  Calendar,
  Filter,
  Download,
  UserPlus
} from "lucide-react"
import { UserModal } from "@/components/admin/UserModal"
import { DeleteConfirmModal } from "@/components/admin/DeleteConfirmModal"

interface User {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [filterRole, setFilterRole] = useState<string>("")

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      (user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (filterRole === "" || user.role.toLowerCase() === filterRole.toLowerCase())
  )

  // Stats
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status === "Active").length
  const adminUsers = users.filter(u => u.role.toLowerCase() === "admin").length

  const handleAddUser = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
    setActionMenuOpen(null)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setIsDeleteModalOpen(true)
    setActionMenuOpen(null)
  }

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active"
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        setUsers(users.map(u => 
          u.id === user.id ? { ...u, status: newStatus } : u
        ))
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error)
    }
    setActionMenuOpen(null)
  }

  const confirmDelete = async () => {
    if (!selectedUser) return
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setUsers(users.filter(u => u.id !== selectedUser.id))
        setIsDeleteModalOpen(false)
        setSelectedUser(null)
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
    }
  }

  const handleSaveUser = async (userData: Partial<User> & { password?: string }) => {
    try {
      if (selectedUser) {
        // Update existing user
        const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        })
        if (response.ok) {
          const result = await response.json()
          setUsers(users.map(u => 
            u.id === selectedUser.id ? { ...u, ...result.user } : u
          ))
        }
      } else {
        // Create new user
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        })
        if (response.ok) {
          const newUser = await response.json()
          setUsers([newUser, ...users])
        }
      }
      setIsModalOpen(false)
      setSelectedUser(null)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-amber-100 text-amber-700 border border-amber-200"
      case "contributor":
        return "bg-blue-100 text-blue-700 border border-blue-200"
      default:
        return "bg-stone-100 text-stone-600 border border-stone-200"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    return status === "Active"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-stone-100 text-stone-500 border border-stone-200"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            Gestion des Utilisateurs
          </h1>
          <p className="text-stone-500 mt-1">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter un utilisateur
        </button>
      </div>

     

      {/* Search and filters */}
      <div className="rounded-2xl bg-white border border-stone-200/60 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-10 pr-4 text-sm text-stone-800 placeholder-stone-400 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-2.5 text-sm text-stone-700 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="contributor">Contributeur</option>
              <option value="user">Utilisateur</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchUsers}
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 hover:border-stone-300"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
            <button className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-600 transition-all hover:bg-stone-50 hover:border-stone-300">
              <Download className="h-4 w-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Utilisateur
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Rôle
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Statut
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Date de création
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
                      <p className="text-stone-500 font-medium">Chargement des utilisateurs...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
                        <Users className="h-8 w-8 text-stone-400" />
                      </div>
                      <p className="text-stone-500 font-medium">Aucun utilisateur trouvé</p>
                      <p className="text-sm text-stone-400">Essayez de modifier vos critères de recherche</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="group transition-colors hover:bg-amber-50/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                          <span className="text-sm font-bold text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-stone-800">
                            {user.name}
                          </p>
                          <p className="text-sm text-stone-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role.toLowerCase() === 'admin' && <Shield className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(
                          user.status
                        )}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-stone-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {user.createdAt}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() =>
                            setActionMenuOpen(
                              actionMenuOpen === user.id ? null : user.id
                            )
                          }
                          className="rounded-lg p-2 text-stone-400 transition-all hover:bg-stone-100 hover:text-stone-600"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {actionMenuOpen === user.id && (
                          <div className="absolute right-0 z-10 mt-2 w-52 rounded-xl border border-stone-200 bg-white py-2 shadow-xl shadow-stone-200/50">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                            >
                              <Edit className="h-4 w-4 text-stone-400" />
                              Modifier
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                            >
                              {user.status === "Active" ? (
                                <>
                                  <UserX className="h-4 w-4 text-stone-400" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 text-emerald-500" />
                                  Activer
                                </>
                              )}
                            </button>
                            <div className="my-1 border-t border-stone-100" />
                            <button
                              onClick={() => handleDeleteUser(user)}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedUser(null)
        }}
        onSave={handleSaveUser}
        user={selectedUser}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedUser(null)
        }}
        onConfirm={confirmDelete}
        userName={selectedUser?.name || ""}
      />
    </div>
  )
}
