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
  RefreshCw
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
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "contributor":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    return status === "Active"
      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Gestion des Utilisateurs
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Gérez les comptes utilisateurs et leurs permissions
          </p>
        </div>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Search and filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Date de création
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-100">
                            {user.name}
                          </p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(
                          user.status
                        )}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {user.createdAt}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() =>
                            setActionMenuOpen(
                              actionMenuOpen === user.id ? null : user.id
                            )
                          }
                          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {actionMenuOpen === user.id && (
                          <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              <Edit className="h-4 w-4" />
                              Modifier
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              {user.status === "Active" ? (
                                <>
                                  <UserX className="h-4 w-4" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4" />
                                  Activer
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
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
