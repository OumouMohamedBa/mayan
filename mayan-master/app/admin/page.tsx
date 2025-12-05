"use client"

import { useEffect, useState } from "react"
import { 
  Users, 
  FileText, 
  Shield, 
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  FileUp,
  Key,
  Settings,
  BarChart3,
  PieChart,
  Calendar,
  Zap
} from "lucide-react"
import Link from "next/link"

interface Stats {
  totalUsers: number
  totalDocuments: number
  activeUsers: number
  recentActivity: number
}

interface RecentActivity {
  id: string
  type: 'user_created' | 'document_uploaded' | 'access_granted' | 'login'
  description: string
  user: string
  time: string
  status: 'success' | 'warning' | 'info'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDocuments: 0,
    activeUsers: 0,
    recentActivity: 0,
  })
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

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

  // Mock recent activities
  const recentActivities: RecentActivity[] = [
    { id: '1', type: 'user_created', description: 'Nouvel utilisateur créé', user: 'Marie Dupont', time: 'Il y a 5 min', status: 'success' },
    { id: '2', type: 'document_uploaded', description: 'Document téléversé', user: 'Jean Martin', time: 'Il y a 12 min', status: 'info' },
    { id: '3', type: 'access_granted', description: 'Accès temporaire accordé', user: 'Sophie Bernard', time: 'Il y a 25 min', status: 'success' },
    { id: '4', type: 'login', description: 'Connexion réussie', user: 'Pierre Durand', time: 'Il y a 1h', status: 'info' },
    { id: '5', type: 'access_granted', description: 'Accès expiré', user: 'Luc Moreau', time: 'Il y a 2h', status: 'warning' },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_created': return UserPlus
      case 'document_uploaded': return FileUp
      case 'access_granted': return Key
      case 'login': return Users
      default: return Activity
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-emerald-100 text-emerald-600'
      case 'warning': return 'bg-amber-100 text-amber-600'
      case 'info': return 'bg-blue-100 text-blue-600'
      default: return 'bg-stone-100 text-stone-600'
    }
  }

  const statCards = [
    {
      title: "Utilisateurs",
      value: stats.totalUsers,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      color: "from-blue-500 to-blue-600",
      lightColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Utilisateurs Actifs",
      value: stats.activeUsers,
      icon: Activity,
      trend: "+8%",
      trendUp: true,
      color: "from-emerald-500 to-emerald-600",
      lightColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Documents",
      value: stats.totalDocuments,
      icon: FileText,
      trend: "+24%",
      trendUp: true,
      color: "from-violet-500 to-violet-600",
      lightColor: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      title: "Administrateurs",
      value: stats.totalUsers > 0 ? 1 : 0,
      icon: Shield,
      trend: "0%",
      trendUp: true,
      color: "from-amber-500 to-orange-500",
      lightColor: "bg-amber-50",
      iconColor: "text-amber-600",
    },
  ]

  const quickActions = [
    { 
      href: "/admin/users", 
      label: "Gérer les utilisateurs", 
      description: "Ajouter, modifier ou supprimer",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50 group-hover:bg-blue-100"
    },
    { 
      href: "/admin/documents", 
      label: "Gérer les documents", 
      description: "Téléverser et organiser",
      icon: FileText,
      color: "from-violet-500 to-violet-600",
      lightBg: "bg-violet-50 group-hover:bg-violet-100"
    },
    { 
      href: "/admin/access-rules", 
      label: "Accès temporaires", 
      description: "Configurer les permissions",
      icon: Key,
      color: "from-emerald-500 to-emerald-600",
      lightBg: "bg-emerald-50 group-hover:bg-emerald-100"
    },
    { 
      href: "/admin/settings", 
      label: "Paramètres système", 
      description: "Configuration avancée",
      icon: Settings,
      color: "from-amber-500 to-orange-500",
      lightBg: "bg-amber-50 group-hover:bg-amber-100"
    },
  ]

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-800">
            Tableau de bord
          </h1>
          <p className="text-stone-500 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formatDate(currentTime)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">Système opérationnel</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="group relative overflow-hidden rounded-2xl bg-white border border-stone-200/60 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Background decoration */}
              <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full ${stat.lightColor} opacity-50 blur-2xl group-hover:opacity-70 transition-opacity`} />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.lightColor} transition-colors`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {stat.trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {stat.trend}
                  </div>
                </div>
                
                <div>
                  <p className="text-3xl font-bold text-stone-800">
                    {loading ? (
                      <span className="inline-block h-8 w-16 animate-pulse rounded bg-stone-200" />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="text-sm text-stone-500 mt-1">
                    {stat.title}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white border border-stone-200/60 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-stone-800">Actions Rapides</h2>
                <p className="text-sm text-stone-500">Accédez rapidement aux fonctionnalités clés</p>
              </div>
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex items-center gap-4 rounded-xl border border-stone-100 bg-stone-50/50 p-4 transition-all hover:bg-white hover:border-stone-200 hover:shadow-md"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.lightBg} transition-colors`}>
                      <Icon className="h-6 w-6 text-stone-600 group-hover:text-stone-800" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-stone-800 group-hover:text-stone-900">
                        {action.label}
                      </p>
                      <p className="text-sm text-stone-500">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-stone-400 group-hover:text-stone-600 group-hover:translate-x-1 transition-all" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-white border border-stone-200/60 p-6 shadow-sm h-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-stone-800">Activité Récente</h2>
                <p className="text-sm text-stone-500">Dernières actions</p>
              </div>
              <Clock className="h-5 w-5 text-stone-400" />
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div key={activity.id} className="flex items-start gap-3 group">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${getStatusColor(activity.status)} transition-colors`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-stone-500">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <Link 
              href="/admin/activity" 
              className="mt-6 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-800 transition-colors"
            >
              Voir tout l'historique
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* System Health */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">État du Système</h3>
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-emerald-100">Base de données</span>
              <span className="font-semibold">Opérationnel</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-100">Mayan EDMS</span>
              <span className="font-semibold">Connecté</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-100">Stockage</span>
              <span className="font-semibold">78% libre</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="rounded-2xl bg-white border border-stone-200/60 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-stone-800">Performance</h3>
            <BarChart3 className="h-5 w-5 text-stone-400" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-stone-600">Temps de réponse</span>
                <span className="text-sm font-semibold text-emerald-600">Excellent</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" style={{ width: '92%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-stone-600">Utilisation CPU</span>
                <span className="text-sm font-semibold text-blue-600">Normal</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-stone-600">Mémoire</span>
                <span className="text-sm font-semibold text-amber-600">Modéré</span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '68%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 shadow-lg text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Statistiques Rapides</h3>
            <Activity className="h-6 w-6" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-white/20">
              <span className="text-violet-100">Connexions aujourd'hui</span>
              <span className="text-2xl font-bold">127</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/20">
              <span className="text-violet-100">Documents ajoutés</span>
              <span className="text-2xl font-bold">43</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-violet-100">Accès accordés</span>
              <span className="text-2xl font-bold">18</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
