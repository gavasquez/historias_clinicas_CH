import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export type AppRole = "super_admin" | "administrador" | "medico" | "enfermera" | "administrativo" | "directivo" | string;

export interface AppSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: AppRole;
}

export interface AppSession {
  user: AppSessionUser;
}

export async function requireAuth(
  _request: NextRequest,
): Promise<AppSession | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  return session as AppSession;
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: AppRole[],
): Promise<AppSession | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const role = result.user.role;
  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  return result;
}

export async function hasPermission(
  roleName: string | undefined,
  permissionCode: string,
): Promise<boolean> {
  if (!roleName) return false;
  if (roleName === "super_admin") return true;

  const role = await prisma.roles.findUnique({
    where: { nombre: roleName },
    select: { id_rol: true },
  });

  if (!role) return false;

  const grant = await prisma.roles_permisos.findFirst({
    where: {
      id_rol: role.id_rol,
      concedido: true,
      permisos: {
        codigo: permissionCode,
        activo: true,
      },
    },
  });

  return !!grant;
}

export async function requirePermission(
  request: NextRequest,
  permissionCode: string,
): Promise<AppSession | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  const permitted = await hasPermission(result.user.role, permissionCode);
  if (!permitted) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  return result;
}

export async function requireAnyPermission(
  request: NextRequest,
  permissionCodes: string[],
): Promise<AppSession | NextResponse> {
  const result = await requireAuth(request);
  if (result instanceof NextResponse) return result;

  for (const code of permissionCodes) {
    if (await hasPermission(result.user.role, code)) {
      return result;
    }
  }

  return NextResponse.json({ message: "No autorizado" }, { status: 403 });
}
