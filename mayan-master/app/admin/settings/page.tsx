"use client"

import { useState } from "react"
import { Save, Shield, Bell, Database, Globe, CheckCircle, Server, Zap, Lock, Mail, AlertTriangle } from "lucide-react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "Mayan",
    siteDescription: "Système de gestion documentaire",
    allowRegistration: true,
    emailNotifications: true,
    maintenanceMode: false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">
            Paramètres
          </h1>
          <p className="text-stone-500 mt-1">
            Configurez les paramètres du système
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
            saved 
              ? 'bg-emerald-500 text-white'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5'
          } disabled:opacity-50`}
        >
          {saved ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Enregistré !
            </>
          ) : saving ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Enregistrer
            </>
          )}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Globe className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-stone-800">
                Paramètres généraux
              </h2>
              <p className="text-sm text-stone-500">
                Configuration de base du site
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-stone-700">
                Nom du site
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-stone-700">
                Description
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) =>
                  setSettings({ ...settings, siteDescription: e.target.value })
                }
                rows={3}
                className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-4 py-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-300 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-bold text-stone-800">
                Sécurité
              </h2>
              <p className="text-sm text-stone-500">
                Paramètres de sécurité et d'accès
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50/50 border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-stone-200">
                  <Lock className="h-5 w-5 text-stone-500" />
                </div>
                <div>
                  <p className="font-semibold text-stone-800">
                    Autoriser les inscriptions
                  </p>
                  <p className="text-sm text-stone-500">
                    Permettre aux nouveaux utilisateurs de s'inscrire
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    allowRegistration: !settings.allowRegistration,
                  })
                }
                className={`relative h-7 w-12 rounded-full transition-all duration-300 ${
                  settings.allowRegistration
                    ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                    : "bg-stone-300"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    settings.allowRegistration ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50/50 border border-stone-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-stone-200">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-stone-800">
                    Mode maintenance
                  </p>
                  <p className="text-sm text-stone-500">
                    Seuls les admins peuvent accéder
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    maintenanceMode: !settings.maintenanceMode,
                  })
                }
                className={`relative h-7 w-12 rounded-full transition-all duration-300 ${
                  settings.maintenanceMode
                    ? "bg-amber-500 shadow-lg shadow-amber-500/30"
                    : "bg-stone-300"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    settings.maintenanceMode ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50">
              <Bell className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h2 className="font-bold text-stone-800">
                Notifications
              </h2>
              <p className="text-sm text-stone-500">
                Gérer les notifications système
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50/50 border border-stone-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-stone-200">
                <Mail className="h-5 w-5 text-stone-500" />
              </div>
              <div>
                <p className="font-semibold text-stone-800">
                  Notifications par email
                </p>
                <p className="text-sm text-stone-500">
                  Recevoir des notifications par email
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  emailNotifications: !settings.emailNotifications,
                })
              }
              className={`relative h-7 w-12 rounded-full transition-all duration-300 ${
                settings.emailNotifications
                  ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                  : "bg-stone-300"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  settings.emailNotifications ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Database Info */}
        <div className="rounded-2xl border border-stone-200/60 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100">
              <Database className="h-6 w-6 text-stone-600" />
            </div>
            <div>
              <h2 className="font-bold text-stone-800">
                Base de données
              </h2>
              <p className="text-sm text-stone-500">
                Informations sur la base de données
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-stone-50/50 border border-stone-100 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Server className="h-4 w-4 text-stone-400" />
                <p className="text-sm text-stone-500">Type</p>
              </div>
              <p className="font-semibold text-stone-800">
                PostgreSQL (Neon)
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-4">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-4 w-4 text-emerald-500" />
                <p className="text-sm text-stone-500">Statut</p>
              </div>
              <p className="font-semibold text-emerald-600 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Connecté
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-800">Mayan EDMS</p>
                <p className="text-sm text-amber-700">
                  Connecté à l'instance Mayan EDMS pour la gestion documentaire
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
