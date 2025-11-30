"use client"

import { useEffect, useState } from "react"
import { Users, FileText, Shield, Activity } from "lucide-react"

interface Stats {
  totalUsers: number
  totalDocuments: number
  activeUsers: number
  recentActivity: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDocuments: 0,
    activeUsers: 0,
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/users")
        if (response.ok) {
          const users = await response.json()
          setStats(prev => ({
            ...prev,
            totalUsers: users.length,
            activeUsers: users.filter((u: any) => u.status === "Active").length,
          }))
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Total Utilisateurs",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Utilisateurs Actifs",
      value: stats.activeUsers,
      icon: Activity,
      color: "bg-green-500",
    },
    {
      title: "Documents",
      value: stats.totalDocuments,
      icon: FileText,
      color: "bg-purple-500",
    },
    {
      title: "Admins",
      value: stats.totalUsers > 0 ? 1 : 0,
      icon: Shield,
      color: "bg-orange-500",
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Vue d'ensemble de votre système
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex items-center gap-4">
                <div className={`rounded-lg ${stat.color} p-3`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    {loading ? "..." : stat.value}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Actions Rapides
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/admin/users"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            <Users className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              Gérer les utilisateurs
            </span>
          </a>
          <a
            href="/admin/documents"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            <FileText className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              Gérer les documents
            </span>
          </a>
          <a
            href="/admin/settings"
            className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          >
            <Shield className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              Paramètres système
            </span>
          </a>
        </div>
      </div>
    </div>
  )
}
