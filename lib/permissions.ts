export type UserRole = "admin" | "contributor" | "reader"

export interface Permission {
  action: string
  resource: string
}

export interface TemporaryAccess {
  documentId: string
  userId: string
  expiresAt: Date
  permissions: Permission[]
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { action: "create", resource: "user" },
    { action: "read", resource: "user" },
    { action: "update", resource: "user" },
    { action: "delete", resource: "user" },
    { action: "create", resource: "document" },
    { action: "read", resource: "document" },
    { action: "update", resource: "document" },
    { action: "delete", resource: "document" },
    { action: "manage", resource: "permissions" },
    { action: "manage", resource: "system" },
  ],
  contributor: [
    { action: "create", resource: "document" },
    { action: "read", resource: "document" },
    { action: "update", resource: "document" },
    { action: "delete", resource: "document" },
  ],
  reader: [
    { action: "read", resource: "document" },
  ],
}

export function hasPermission(
  userRole: UserRole,
  action: string,
  resource: string,
  userId?: string,
  resourceOwnerId?: string,
  temporaryAccess?: TemporaryAccess[]
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole]
  
  // Admin has full access to all resources
  if (userRole === "admin") {
    return permissions.some(
      (p) => p.action === action && p.resource === resource
    )
  }
  
  // Check temporary access permissions
  if (temporaryAccess && userId) {
    const now = new Date()
    const relevantAccess = temporaryAccess.find(
      access => access.userId === userId && 
                access.expiresAt > now &&
                access.permissions.some(p => p.action === action && p.resource === resource)
    )
    if (relevantAccess) {
      return true
    }
  }
  
  // Check role-based permissions
  return permissions.some(
    (p) => p.action === action && p.resource === resource
  )
}
