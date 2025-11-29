"use client"

import { useSession } from "next-auth/react"
import { UserRole, hasPermission } from "@/lib/permissions"

export function useAuth() {
  const { data: session, status } = useSession()

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    role: session?.user?.role as UserRole,
    isAdmin: session?.user?.role === "admin",
  }
}

export function usePermissions() {
  const { user, role } = useAuth()

  const hasPermissionFn = (action: string, resource: string) => {
    if (!user || !role) return false
    
    return hasPermission(role, action, resource, user.id)
  }

  const isAdmin = role === "admin"
  const isContributor = role === "contributor"
  const isReader = role === "reader"

  return {
    hasPermission: hasPermissionFn,
    isAdmin,
    isContributor,
    isReader,
    user,
    role,
  }
}
