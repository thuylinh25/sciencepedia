import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`register:${ip}`, { limit: 5, windowMs: 600_000 });
  if (!limit.ok) {
    return Response.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "INVALID_INPUT", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: await bcrypt.hash(password, 12),
      },
      select: { id: true, email: true, name: true },
    });

    return Response.json({ user }, { status: 201 });
  } catch (error) {
    // P2002 = vi phạm ràng buộc unique (email đã tồn tại)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return Response.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }

    console.error("[register] lỗi tạo tài khoản:", error);
    return Response.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
