import { AppRole } from "@/lib/auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: AppRole;
  }

  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      role?: AppRole;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AppRole;
  }
}
