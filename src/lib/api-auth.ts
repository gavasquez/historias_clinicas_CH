import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Roles con capacidades administrativas. Se incluyen "administrativo" (el que
 * crea el seed) y "administrador" (el nombre que valida parte del código).
 */
export const ADMIN_ROLES = [
  "super_admin",
  "administrativo",
  "administrador",
] as const;

export type SessionUser = {
  id: number;
  role: string | null;
  name: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) return null;

  const id = Number((user as { id?: string | number }).id);
  const role = (user as { role?: string }).role ?? null;

  if (!Number.isInteger(id) || id <= 0) return null;

  return { id, role, name: user.name ?? null };
}

/**
 * Devuelve el usuario de la sesión o una respuesta 401/403 lista para retornar.
 *
 *   const auth = await requireSession();
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireSession(
  allowedRoles?: readonly string[],
): Promise<SessionUser | NextResponse> {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!user.role || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { message: "No tiene permisos para realizar esta acción" },
        { status: 403 },
      );
    }
  }

  return user;
}
