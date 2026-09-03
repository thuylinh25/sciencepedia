import "server-only";

import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { atLeast } from "./roles";

export { atLeast } from "./roles";

export class AuthError extends Error {
  constructor(public code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(code);
    this.name = "AuthError";
  }
  get status() {
    return this.code === "UNAUTHENTICATED" ? 401 : 403;
  }
}

/** Lấy user hiện tại; ném AuthError nếu chưa đăng nhập. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new AuthError("UNAUTHENTICATED");
  return session.user;
}

/** Lấy user và kiểm tra quyền tối thiểu. */
export async function requireRole(required: Role) {
  const user = await requireUser();
  if (!atLeast(user.role, required)) throw new AuthError("FORBIDDEN");
  return user;
}

/** Biến AuthError thành Response JSON cho các API route. */
export function authErrorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json({ error: error.code }, { status: error.status });
  }
  return null;
}
