"use client"

import { useState } from "react"
import { Save, Shield, Bell, Database, Globe } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "Mayan",
    siteDescription: "Système de gestion documentaire",
    allowRegistration: true,
    emailNotifications: true,
    maintenanceMode: false,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Paramètres
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Configurez les paramètres du système
        </p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Paramètres généraux
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Configuration de base du site
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nom du site
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
                className="w-full max-w-md rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) =>
                  setSettings({ ...settings, siteDescription: e.target.value })
                }
                rows={3}
                className="w-full max-w-md rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Sécurité
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Paramètres de sécurité et d'accès
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Autoriser les inscriptions
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Permettre aux nouveaux utilisateurs de s'inscrire
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    allowRegistration: !settings.allowRegistration,
                  })
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.allowRegistration
                    ? "bg-green-500"
                    : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    settings.allowRegistration ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Mode maintenance
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Activer le mode maintenance (seuls les admins peuvent accéder)
                </p>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    maintenanceMode: !settings.maintenanceMode,
                  })
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  settings.maintenanceMode
                    ? "bg-orange-500"
                    : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Bell className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Notifications
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Gérer les notifications système
              </p>
            </div>
          </div>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                Notifications par email
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Recevoir des notifications par email
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  emailNotifications: !settings.emailNotifications,
                })
              }
              className={`relative h-6 w-11 rounded-full transition-colors ${
                settings.emailNotifications
                  ? "bg-green-500"
                  : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                  settings.emailNotifications ? "translate-x-5" : ""
                }`}
              />
            </button>
          </label>
        </div>

        {/* Database Info */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Database className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            </div>
            <div>
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                Base de données
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Informations sur la base de données
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Type</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">
                PostgreSQL (Neon)
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Statut</p>
              <p className="font-medium text-green-600 dark:text-green-400">
                Connecté
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <Save className="h-4 w-4" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </div>
  )
}
