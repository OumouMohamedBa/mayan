"use client"

import { useState, useEffect } from "react"
import { X, FileText, Folder, Tag, LayoutGrid } from "lucide-react"

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
  status: string
}

interface User {
  id: string
  name: string
  email: string
}

interface AccessRuleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (ruleData: any) => void
  rule: AccessRule | null
  users: User[]
}

const targetTypes = [
  { value: "document", label: "Document", icon: FileText },
  { value: "folder", label: "Dossier", icon: Folder },
  { value: "tag", label: "Tag", icon: Tag },
  { value: "category", label: "Catégorie", icon: LayoutGrid },
]

export function AccessRuleModal({
  isOpen,
  onClose,
  onSave,
  rule,
  users,
}: AccessRuleModalProps) {
  const [formData, setFormData] = useState({
    userId: "",
    targetType: "document" as "document" | "folder" | "tag" | "category",
    targetId: "",
    targetName: "",
    startDate: "",
    endDate: "",
    isActive: true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (rule) {
      setFormData({
        userId: rule.userId,
        targetType: rule.targetType,
        targetId: rule.targetId,
        targetName: rule.targetName,
        startDate: rule.startDate.split("T")[0],
        endDate: rule.endDate.split("T")[0],
        isActive: rule.isActive,
      })
    } else {
      const today = new Date().toISOString().split("T")[0]
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      
      setFormData({
        userId: "",
        targetType: "document",
        targetId: "",
        targetName: "",
        startDate: today,
        endDate: nextMonth.toISOString().split("T")[0],
        isActive: true,
      })
    }
    setErrors({})
  }, [rule, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.userId) {
      newErrors.userId = "Veuillez sélectionner un utilisateur"
    }

    if (!formData.targetId.trim()) {
      newErrors.targetId = "L'identifiant de la cible est requis"
    }

    if (!formData.startDate) {
      newErrors.startDate = "La date de début est requise"
    }

    if (!formData.endDate) {
      newErrors.endDate = "La date de fin est requise"
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      if (end <= start) {
        newErrors.endDate = "La date de fin doit être après la date de début"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave({
        userId: formData.userId,
        targetType: formData.targetType,
        targetId: formData.targetId,
        targetName: formData.targetName || formData.targetId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isActive: formData.isActive,
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {rule ? "Modifier la règle d'accès" : "Créer une règle d'accès"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* User Select */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Utilisateur
            </label>
            <select
              value={formData.userId}
              onChange={(e) =>
                setFormData({ ...formData, userId: e.target.value })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-100 ${
                errors.userId
                  ? "border-red-300 focus:ring-red-500"
                  : "border-zinc-200 focus:ring-zinc-500 dark:border-zinc-700"
              }`}
            >
              <option value="">Sélectionner un utilisateur</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {errors.userId && (
              <p className="mt-1 text-xs text-red-500">{errors.userId}</p>
            )}
          </div>

          {/* Target Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Type de cible
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {targetTypes.map((type) => {
                const Icon = type.icon
                const isSelected = formData.targetType === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        targetType: type.value as typeof formData.targetType,
                      })
                    }
                    className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                        : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Target ID */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Identifiant de la cible
            </label>
            <input
              type="text"
              value={formData.targetId}
              onChange={(e) =>
                setFormData({ ...formData, targetId: e.target.value })
              }
              className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-100 ${
                errors.targetId
                  ? "border-red-300 focus:ring-red-500"
                  : "border-zinc-200 focus:ring-zinc-500 dark:border-zinc-700"
              }`}
              placeholder="Ex: DOC-001, FOLDER-RH, TAG-CONTRATS"
            />
            {errors.targetId && (
              <p className="mt-1 text-xs text-red-500">{errors.targetId}</p>
            )}
          </div>

          {/* Target Name (optional) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nom de la cible{" "}
              <span className="text-zinc-400">(optionnel)</span>
            </label>
            <input
              type="text"
              value={formData.targetName}
              onChange={(e) =>
                setFormData({ ...formData, targetName: e.target.value })
              }
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Ex: Dossier RH, Contrats 2024"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Nom descriptif pour identifier facilement la cible
            </p>
          </div>

          {/* Date Range */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Date de début
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-100 ${
                  errors.startDate
                    ? "border-red-300 focus:ring-red-500"
                    : "border-zinc-200 focus:ring-zinc-500 dark:border-zinc-700"
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Date de fin
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className={`w-full rounded-lg border px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-100 ${
                  errors.endDate
                    ? "border-red-300 focus:ring-red-500"
                    : "border-zinc-200 focus:ring-zinc-500 dark:border-zinc-700"
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Règle activée
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                La règle sera appliquée immédiatement si activée
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData({ ...formData, isActive: !formData.isActive })
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${
                formData.isActive
                  ? "bg-green-500"
                  : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  formData.isActive ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {rule ? "Enregistrer" : "Créer la règle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
