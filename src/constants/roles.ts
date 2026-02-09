export const ROLES = ['super', 'admin', 'manager', 'employee'] as const
export type UserRole = (typeof ROLES)[number]

const CREATABLE_ROLES: Record<UserRole, readonly UserRole[]> = {
  super: ROLES,
  admin: ROLES.slice(1),
  manager: ROLES.slice(3),
  employee: [],
}

export function canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
  return (CREATABLE_ROLES[creatorRole] as readonly UserRole[]).includes(targetRole)
}

export function getCreatableRoles(creatorRole: string): UserRole[] {
  const role = creatorRole as UserRole
  if (!ROLES.includes(role)) return []
  return [...CREATABLE_ROLES[role]]
}

export const ROLE_LABELS: Record<UserRole, string> = {
  super: 'Суперпользователь',
  admin: 'Администратор',
  manager: 'Руководитель',
  employee: 'Сотрудник',
}
