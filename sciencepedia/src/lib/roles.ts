import type { Role } from "@prisma/client";

/**
 * Tiện ích quyền dùng được ở CẢ client lẫn server.
 * Không import prisma/auth ở đây, nếu không client bundle sẽ kéo theo server code.
 */
const RANK: Record<Role, number> = { USER: 0, EDITOR: 1, ADMIN: 2 };

export function atLeast(role: Role | undefined | null, required: Role) {
  if (!role) return false;
  return RANK[role] >= RANK[required];
}

export const ROLES: Role[] = ["USER", "EDITOR", "ADMIN"];
