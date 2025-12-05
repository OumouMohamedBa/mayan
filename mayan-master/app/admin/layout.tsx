"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
  Users, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut,
  Shield,
  KeyRound,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, description: "Vue d'ensemble" },
  { href: "/admin/users", label: "Utilisateurs", icon: Users, description: "Gestion des comptes" },
  { href: "/admin/access-rules", label: "Accès temporaires", icon: KeyRound, description: "Permissions" },
  { href: "/admin/documents", label: "Documents", icon: FileText, description: "Fichiers & médias" },
  { href: "/admin/settings", label: "Paramètres", icon: Settings, description: "Configuration" },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAdmin, isLoading, isAuthenticated, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      router.push("/auth/signin")
    }
  }, [isLoading, isAuthenticated, isAdmin, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-stone-600 font-medium">Chargement de l'espace admin...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-orange-50/10">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-stone-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex w-72 flex-col 
        bg-white/80 backdrop-blur-xl border-r border-stone-200/60
        shadow-xl shadow-stone-200/20
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Header */}
        <div className="flex h-20 items-center justify-between px-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-800">Mayan Admin</h1>
              <p className="text-xs text-stone-500">Panneau de contrôle</p>
            </div>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-stone-100 text-stone-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className="px-3 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Menu principal
          </p>
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || 
              (link.href !== "/admin" && pathname.startsWith(link.href))
            const Icon = link.icon
            
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900"
                }`}
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                  isActive 
                    ? "bg-white/20" 
                    : "bg-stone-100 group-hover:bg-stone-200"
                }`}>
                  <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-stone-500 group-hover:text-stone-700"}`} />
                </div>
                <div className="flex-1">
                  <span className="block">{link.label}</span>
                  <span className={`text-xs ${isActive ? "text-white/70" : "text-stone-400"}`}>
                    {link.description}
                  </span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-white/70" />}
              </Link>
            )
          })}
        </nav>

        {/* User info & Logout */}
        <div className="border-t border-stone-100 p-4">
          <div className="mb-4 rounded-xl bg-gradient-to-r from-stone-50 to-amber-50/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md">
                <span className="text-lg font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-semibold text-stone-800">
                  {user?.name || "Administrateur"}
                </p>
                <p className="truncate text-xs text-stone-500">
                  {user?.email}
                </p>
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Admin actif
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-red-100 bg-red-50/50 px-4 py-3 text-sm font-semibold text-red-600 transition-all hover:bg-red-100 hover:border-red-200"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-20 bg-white/60 backdrop-blur-xl border-b border-stone-200/60 px-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-stone-100 text-stone-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Search Bar */}
            <div className="hidden md:flex items-center gap-2 bg-stone-100/80 rounded-xl px-4 py-2.5 w-80">
              <Search className="h-4 w-4 text-stone-400" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="bg-transparent border-none outline-none text-sm text-stone-700 placeholder:text-stone-400 w-full"
              />
              <kbd className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-xs text-stone-400 border border-stone-200">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl bg-stone-100/80 hover:bg-stone-200/80 text-stone-600 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
            </button>

            {/* Quick user avatar */}
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-stone-200">
              <div className="text-right">
                <p className="text-sm font-medium text-stone-700">{user?.name || "Admin"}</p>
                <p className="text-xs text-stone-500">Administrateur</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-50">
          <div className="p-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
